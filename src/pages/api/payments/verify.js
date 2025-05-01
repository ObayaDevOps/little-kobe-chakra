// pages/api/payments/verify.js
import { getPesapalToken } from '@/lib/pesapal';
// Import the specific Supabase DB functions
import { getPaymentByTrackingId, updatePaymentStatus } from '@/lib/db';
import axios from 'axios';

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
        const paymentStatus = pesapalResponse.data.payment_status_description; // e.g., COMPLETED, FAILED, PENDING, INVALID
        const confirmationCode = pesapalResponse.data.payment_method; // Often used as confirmation, or a specific field if available
        const statusDescription = pesapalResponse.data.description; // Pesapal's description of the status
        const pesapalAmount = pesapalResponse.data.amount; // Amount confirmed by Pesapal

        // 4. Update your Database record status
        // Note: IPN might also update this, handle potential race conditions if necessary
        // Use the DB function to update status based on Pesapal response
        console.log(`Updating DB status for ${orderTrackingId} to ${paymentStatus}`);
        await updatePaymentStatus(
            orderTrackingId,
            paymentStatus, // Use the status from Pesapal
            confirmationCode,
            statusDescription
        );


        // 5. Fetch the *updated and complete* payment record from your DB
        // This record now includes cart_items, billing_address etc.
        const dbPaymentRecord = await getPaymentByTrackingId(orderTrackingId);

        if (!dbPaymentRecord) {
             // This shouldn't happen if updatePaymentStatus succeeded, but handle defensively
             console.error(`Failed to retrieve payment record from DB after status update for ${orderTrackingId}`);
             // Return status based on Pesapal response even if DB fetch failed?
             return res.status(404).json({
                message: 'Payment record not found in our system after verification.',
                status: paymentStatus, // Provide Pesapal status at least
                confirmationCode: confirmationCode,
                statusDescription: statusDescription,
            });
        }

         // Defensive check: Compare amount if possible
         if (dbPaymentRecord.amount !== pesapalAmount) {
             console.warn(`Amount mismatch for ${orderTrackingId}. DB: ${dbPaymentRecord.amount}, Pesapal: ${pesapalAmount}`);
             // Decide how to handle this - log, flag for review, potentially fail?
         }


        // 6. Construct the response for the frontend (callback.js)
        // *** Nest the detailed info under 'orderDetails' ***
        const responsePayload = {
            status: dbPaymentRecord.status, // Use status from your DB (which should match Pesapal now)
            statusDescription: dbPaymentRecord.status_description || statusDescription, // Prefer DB description if available
            confirmationCode: dbPaymentRecord.pesapal_confirmation_code || confirmationCode, // Prefer DB code
            // --- orderDetails object ---
            orderDetails: {
                merchantReference: dbPaymentRecord.merchant_reference,
                totalAmount: dbPaymentRecord.amount,
                currency: dbPaymentRecord.currency,
                items: dbPaymentRecord.cart_items, // The JSONB array from DB
                delivery_address: dbPaymentRecord.delivery_address, //OD: The JSONB object from DB (or individual fields if stored separately)
                customer_email: dbPaymentRecord.customer_email, // Include for convenience
                customer_phone: dbPaymentRecord.customer_phone, // Include for convenience
            }
            // --- End orderDetails object ---
        };

        console.log(`Sending verification success response for ${orderTrackingId} to frontend.`);
        res.status(200).json(responsePayload);

    } catch (error) {
        console.error(`Error verifying payment for ${orderTrackingId}:`, error.response?.data || error.message, error.stack);

         // Differentiate between Pesapal API errors and internal errors
         if (axios.isAxiosError(error) && error.response?.config?.url?.includes(PESAPAL_BASE_URL)) {
             // Error calling Pesapal status check
             return res.status(502).json({ message: 'Failed to communicate with payment provider for status check.' });
         } else if (error.message.startsWith('Database error')) {
            // Error interacting with our DB
            return res.status(500).json({ message: 'Internal server error during verification process.' });
        } else {
            // Other unexpected errors
            return res.status(500).json({ message: error.message || 'An unexpected error occurred during payment verification.' });
        }
    }
}