// pages/api/payments/verify.js
import { getPesapalToken } from '@/lib/pesapal';
// Import the specific Supabase DB functions
import {
    getPaymentByTrackingId,
    updatePaymentStatus,
    // --- Add imports for new order/inventory functions ---
    findOrderExistsByPaymentId,
    createOrderAndItems, // We'll create this combined function
    // getProductDetailsByIds, // Helper if createOrderAndItems doesn't fetch prices itself
    // updateInventoryStock // Function to decrement stock (add later if needed)
    // --- End new imports ---
} from '@/lib/db';
import axios from 'axios';
import { sendOrderConfirmationWhatsApp } from '@/lib/whatsappNotification';
import {
    sendShopkeeperOrderConfirmationEmail,
    sendCustomerOrderConfirmationEmail,
} from '@/lib/orderConfirmationEmail';

const PESAPAL_BASE_URL = process.env.PESAPAL_API_BASE_URL;

// Helper to map Pesapal status codes
const mapPesapalStatus = (statusCode) => {
    switch (statusCode) {
        case 0: return 'INVALID'; // Or FAILED?
        case 1: return 'COMPLETED';
        case 2: return 'FAILED';
        case 3: return 'REVERSED'; // Or FAILED/REFUNDED?
        default: return 'PENDING'; // Or UNKNOWN?
    }
};

export default async function handler(req, res) {
     if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { orderTrackingId } = req.body;

    if (!orderTrackingId) {
        return res.status(400).json({ message: 'Order Tracking ID is required.' });
    }

    try {
        console.log(`Verifying payment status for OrderTrackingId: ${orderTrackingId}`);
        const existingPaymentBeforeUpdate = await getPaymentByTrackingId(orderTrackingId);

        // 1. Get Pesapal Token
        const token = await getPesapalToken();

        // 2. Call Pesapal GetTransactionStatus API
        const statusUrl = `${PESAPAL_BASE_URL}/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`;
        console.log(`Querying Pesapal status URL: ${statusUrl}`);

        const pesapalResponse = await axios.get(statusUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                    'Accept': 'application/json',
            },
            timeout: 20000, // Add a reasonable timeout
        });

        console.log(`Pesapal status response for ${orderTrackingId}:`, pesapalResponse.data);

        // 3. Process Pesapal Response
        if (pesapalResponse.data.error && pesapalResponse.data.error.code) {
            console.error(`Pesapal returned error for status check ${orderTrackingId}:`, pesapalResponse.data.error);
            // Consider fetching DB record here to return *some* info? Or just fail.
             return res.status(502).json({ // Bad Gateway - Pesapal error
                 message: pesapalResponse.data.error.message || 'Failed to get transaction status from Pesapal.',
                 pesapal_error_code: pesapalResponse.data.error.code
             });
        }

        // Extract relevant data from Pesapal response
        const confirmationCode = pesapalResponse.data.confirmation_code || null;
        const paymentMethod = pesapalResponse.data.payment_method || null;
        const statusDescription = pesapalResponse.data.payment_status_description || pesapalResponse.data.description;
        const statusCode = pesapalResponse.data.status_code; // Assuming this field exists

        // Map Pesapal status to our internal status convention if needed
        const internalStatus = mapPesapalStatus(statusCode); // Use the helper

        // 4. Update your Database record status
        console.log(`Updating DB payment status for ${orderTrackingId} to ${internalStatus}`);
        const updatedPayment = await updatePaymentStatus( // Capture the returned record
            orderTrackingId,
            internalStatus, // Use our mapped status
            paymentMethod,
            confirmationCode,
            statusDescription
        );

        // 5. Fetch the *complete* payment record if update didn't return it or if needed again
        // If updatePaymentStatus returns the updated record, we might not need this separate fetch
        // const dbPaymentRecord = updatedPayment || await getPaymentByTrackingId(orderTrackingId);
        // Let's assume updatePaymentStatus returns the updated record as implemented in the provided db.js
        const dbPaymentRecord = updatedPayment;

        if (!dbPaymentRecord) {
            console.error(`Failed to retrieve or update payment record in DB for ${orderTrackingId}`);
             return res.status(404).json({
                message: 'Payment record not found or failed to update in our system after verification.',
                status: internalStatus,
                confirmationCode: confirmationCode,
                statusDescription: statusDescription,
            });
        }

        // *** START: Order Creation Logic ***
        // Only proceed if the payment is marked as COMPLETED
        let shouldSendWhatsAppNotifications = false;
        if (internalStatus === 'COMPLETED') {
            console.log(`Payment ${orderTrackingId} (ID: ${dbPaymentRecord.id}) verified as COMPLETED. Checking/Creating order...`);

            try {
                // 2. Check if an Order already exists for this payment_id
                const existingOrder = await findOrderExistsByPaymentId(dbPaymentRecord.id);

                if (!existingOrder) {
                    console.log(`No existing order found for payment ID ${dbPaymentRecord.id}. Creating new order.`);

                    // 3 & 4. Create Order and Order Items
                    // We need cart_items, user_id (if available), addresses etc. from dbPaymentRecord
                    const orderData = {
                        payment_id: dbPaymentRecord.id,
                        user_id: dbPaymentRecord.user_id, // Assuming user_id is stored on payments
                        total_amount: dbPaymentRecord.amount,
                        currency: dbPaymentRecord.currency,
                        shipping_address: dbPaymentRecord.delivery_address, // Map field names
                        billing_address: dbPaymentRecord.billing_address || dbPaymentRecord.delivery_address, // Use delivery if no specific billing
                        customer_email: dbPaymentRecord.customer_email,
                        customer_phone: dbPaymentRecord.customer_phone,
                        status: 'COMPLETED', // Initial status for a new order
                    };

                    const itemsDataForRPC = dbPaymentRecord.cart_items.map(item => ({
                        product_id: item._id, // Map _id to product_id
                        quantity: item.quantity,
                        // Include other fields like price/name ONLY if the RPC *needs* them
                        // and doesn't fetch them itself. Based on the PL/pgSQL, it fetches price/name.
                    }));

                    console.log('ORDER DATA verify - createOrderAndItems', orderData);
                    console.log('ITEMS DATA verify (mapped) - createOrderAndItems', itemsDataForRPC); // Log mapped data
                    const { data: newOrder, error: orderError } = await createOrderAndItems(orderData, itemsDataForRPC); // Pass mapped data

                    if (orderError) {
                        console.error(`Failed to create order/items for payment ID ${dbPaymentRecord.id}:`, orderError);
                        // Decide how critical this is. Should we still return success to the callback?
                        // Maybe log the error but don't fail the verification response?
                        // Or potentially try and set the payment status back to PENDING or NEEDS_ATTENTION?
                        // For now, log and continue, but flag this might need review.
                    } else {
                        console.log(`Successfully created order ${newOrder.id} for payment ${dbPaymentRecord.id}`);
                        shouldSendWhatsAppNotifications = true;
                        // 5. (Optional Step) Update Inventory Stock Levels
                        // await updateInventoryStock(itemsData); // Pass items to decrement counts
                    }

                } else {
                    console.log(`Order ${existingOrder.id} already exists for payment ID ${dbPaymentRecord.id}. Skipping creation.`);
                }

            } catch (orderCreationError) {
                console.error(`Error during order creation/check process for payment ID ${dbPaymentRecord.id}:`, orderCreationError);
                // Log this critical failure. Depending on policy, might need manual intervention.
            }
        }
        // *** END: Order Creation Logic ***

        // 6. Construct the response for the frontend (callback.js)
        const deliveryAddress = dbPaymentRecord.delivery_address || {};
        const customerName =
            (typeof deliveryAddress === 'object' && (deliveryAddress.first_name || deliveryAddress.name)) ||
            dbPaymentRecord.customer_name ||
            'Customer';
        const hasLatLng =
            typeof deliveryAddress === 'object' &&
            typeof deliveryAddress.latitude === 'number' &&
            typeof deliveryAddress.longitude === 'number';
        const deliveryLocation = hasLatLng
            ? {
                  latitude: deliveryAddress.latitude,
                  longitude: deliveryAddress.longitude,
              }
            : null;
        const deliveryLocationText =
            typeof deliveryAddress === 'object'
                ? (deliveryAddress.line_1 || deliveryAddress.address || deliveryAddress.city || '').toString().trim()
                : '';
        const responsePayload = {
            status: dbPaymentRecord.status, // Use status from your DB
            statusDescription: dbPaymentRecord.pesapal_status_description || statusDescription, // Prefer DB description
            confirmationCode: dbPaymentRecord.pesapal_confirmation_code || confirmationCode, // Prefer DB code
            orderDetails: {
                merchantReference: dbPaymentRecord.merchant_reference,
                totalAmount: dbPaymentRecord.amount,
                currency: dbPaymentRecord.currency,
                items: dbPaymentRecord.cart_items,
                delivery_address: dbPaymentRecord.delivery_address,
                customer_email: dbPaymentRecord.customer_email,
                customer_phone: dbPaymentRecord.customer_phone,
                customerName,
                estimatedDelivery: 'Please allow 1 hour post-payment to prepare your order, and transport time, we will notify you when order is sent',
                deliveryLocation,
                deliveryLocationText,
            }
        };

        if (
            internalStatus === 'COMPLETED' &&
            shouldSendWhatsAppNotifications &&
            existingPaymentBeforeUpdate?.status !== 'COMPLETED'
        ) {
            const orderDetailsForComms = { ...responsePayload.orderDetails };
            if (!orderDetailsForComms.customerPhoneNumber) {
                const fallbackPhone = orderDetailsForComms.customer_phone || orderDetailsForComms.customer_phone_number;
                if (fallbackPhone) {
                    orderDetailsForComms.customerPhoneNumber = fallbackPhone.toString().trim();
                }
            }
            const shopkeeperPhone = (
                process.env.SHOPKEEPER_WA_NUMBER ||
                process.env.NEXT_PUBLIC_SHOPKEEPER_WA_NUMBER ||
                ''
            ).toString().trim();

            if (shopkeeperPhone) {
                try {
                    await sendOrderConfirmationWhatsApp({
                        recipientPhoneNumber: shopkeeperPhone,
                        orderDetails: orderDetailsForComms,
                        isShopkeeper: true,
                    });
                    console.log(`Shopkeeper WhatsApp sent for ${orderTrackingId}`);
                } catch (shopkeeperErr) {
                    console.error(
                        `Shopkeeper WhatsApp failed for ${orderTrackingId}:`,
                        shopkeeperErr.response?.data || shopkeeperErr.message
                    );
                }
            }

            const customerPhone = orderDetailsForComms.customerPhoneNumber?.toString().trim();
            if (customerPhone) {
                try {
                    await sendOrderConfirmationWhatsApp({
                        recipientPhoneNumber: customerPhone,
                        orderDetails: orderDetailsForComms,
                        isShopkeeper: false,
                    });
                    console.log(`Customer WhatsApp sent for ${orderTrackingId}`);
                } catch (customerErr) {
                    console.error(
                        `Customer WhatsApp failed for ${orderTrackingId}:`,
                        customerErr.response?.data || customerErr.message
                    );
                }
            }

            try {
                await sendShopkeeperOrderConfirmationEmail(orderDetailsForComms);
                console.log(`Shopkeeper email sent for ${orderTrackingId}`);
            } catch (shopkeeperEmailErr) {
                console.error(
                    `Shopkeeper email failed for ${orderTrackingId}:`,
                    shopkeeperEmailErr.message
                );
            }

            try {
                await sendCustomerOrderConfirmationEmail(orderDetailsForComms);
                console.log(`Customer email sent for ${orderTrackingId}`);
            } catch (customerEmailErr) {
                console.error(
                    `Customer email failed for ${orderTrackingId}:`,
                    customerEmailErr.message
                );
            }
        }

        console.log(`Sending verification success response for ${orderTrackingId} to frontend.`);
        res.status(200).json(responsePayload);

    } catch (error) {
        console.error(`Error verifying payment for ${orderTrackingId}:`, error.response?.data || error.message, error.stack);

         // Differentiate between Pesapal API errors and internal errors
         if (axios.isAxiosError(error) && error.response?.config?.url?.includes(PESAPAL_BASE_URL)) {
             // Error calling Pesapal status check
             return res.status(502).json({ message: 'Failed to communicate with payment provider for status check.' });
         } else if (error.message.startsWith('Supabase') || error.message.startsWith('Database error')) { // Catch DB errors explicitly
            // Error interacting with our DB during payment update or order creation
            console.error("Database interaction error during verification:", error);
            return res.status(500).json({ message: 'Internal server error during verification process.' });
        } else {
            // Other unexpected errors
            console.error("Unexpected error during verification:", error);
            return res.status(500).json({ message: error.message || 'An unexpected error occurred during payment verification.' });
        }
    }
}
