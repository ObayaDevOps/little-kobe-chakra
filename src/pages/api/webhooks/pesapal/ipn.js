// pages/api/webhooks/pesapal/ipn.js
import { getPesapalToken } from '@/lib/pesapal';
// Import the specific Supabase DB functions
import { getPaymentByTrackingId, updatePaymentStatus } from '@/lib/db';
import axios from 'axios';

const PESAPAL_BASE_URL = process.env.PESAPAL_API_BASE_URL;

// Helper to map Pesapal status codes (consistent with verify.js)
const mapPesapalStatus = (statusCode) => {
    switch (statusCode) {
        case 0: return 'INVALID';
        case 1: return 'COMPLETED';
        case 2: return 'FAILED';
        case 3: return 'REVERSED';
        default: return 'PENDING';
    }
};

// --- Main IPN Handler ---
export default async function handler(req, res) {
    console.log(`IPN Received - Method: ${req.method}`);

    // Pesapal IPN v3 seems to use GET with query parameters based on docs
    const { OrderTrackingId, OrderMerchantReference, OrderNotificationType } = req.query;

    console.log(`IPN Data: TrackingId=${OrderTrackingId}, MerchantRef=${OrderMerchantReference}, Type=${OrderNotificationType}`);

    // --- Basic Validation ---
    if (!OrderTrackingId || !OrderMerchantReference || !OrderNotificationType) {
         console.error("IPN Error: Missing required parameters in query.", req.query);
         // Still acknowledge receipt if possible, but indicate an issue
         return res.status(200).json({ // Use 200 OK for ACK, but signal error in payload if possible
             orderNotificationType: OrderNotificationType || 'UNKNOWN',
             orderTrackingId: OrderTrackingId || 'UNKNOWN',
             orderMerchantReference: OrderMerchantReference || 'UNKNOWN',
             status: 500, // Or a custom code indicating processing error
             message: "IPN received but missing required parameters."
         });
    }
    // --- End Basic Validation ---


    // 1. Acknowledge Pesapal IMMEDIATELY
    // IMPORTANT: Send this response before starting heavy processing.
    res.status(200).json({
        orderNotificationType: OrderNotificationType,
        orderTrackingId: OrderTrackingId,
        orderMerchantReference: OrderMerchantReference,
        status: 200 // Acknowledge successful receipt
    });

    // 2. Process Asynchronously (after sending response)
    // Use setImmediate for non-blocking execution in Node.js event loop
    // For production, consider a proper background job queue (e.g., BullMQ, Celery if using Python backend, etc.)
    setImmediate(async () => {
        console.log(`Starting async processing for IPN ${OrderTrackingId}`);
        try {
            // Optional: Check if already processed to prevent redundant updates?
            const existingPayment = await getPaymentByTrackingId(OrderTrackingId);
            // Add robust check: Only skip if status is definitively terminal (COMPLETED, FAILED, REVERSED)
            if (existingPayment && ['COMPLETED', 'FAILED', 'REVERSED', 'INVALID'].includes(existingPayment.status)) {
               console.log(`IPN for ${OrderTrackingId} skipped: Already in terminal state (${existingPayment.status}).`);
               return; // Stop processing
            }

            // Get Fresh Pesapal Token
            const token = await getPesapalToken();

            // Query Pesapal for the definitive status
            console.log(`IPN - Querying Pesapal status for ${OrderTrackingId}`);
            const statusResponse = await axios.get(
                 `${PESAPAL_BASE_URL}/Transactions/GetTransactionStatus`,
                 {
                     params: { orderTrackingId: OrderTrackingId },
                     headers: {
                         'Authorization': `Bearer ${token}`,
                         'Accept': 'application/json',
                         'Content-Type': 'application/json',
                     },
                 }
            );

             // Handle Pesapal API Error during IPN processing
             if (statusResponse.data.error?.code) {
                 console.error(`IPN Error (Status Check) for ${OrderTrackingId}: ${statusResponse.data.error.code} - ${statusResponse.data.error.message}`);
                 // Log error, potentially retry later? Do not proceed with DB update.
                 return;
             }

             // Map status and prepare data
             const pesapalStatusCode = statusResponse.data.status_code;
             const internalStatus = mapPesapalStatus(pesapalStatusCode);
             const confirmationCode = statusResponse.data.confirmation_code;
             const statusDescription = statusResponse.data.payment_status_description;
             const paymentMethod = statusResponse.data.payment_method;

             console.log(`IPN - Pesapal status for ${OrderTrackingId}: Code=${pesapalStatusCode}, Internal=${internalStatus}, ConfCode=${confirmationCode}`);

             // Update Supabase DB record - THIS IS THE CRITICAL STEP for IPN
             // Use the imported Supabase function
             const updatedPayment = await updatePaymentStatus(
                 OrderTrackingId, // Find record using Pesapal's tracking ID
                 internalStatus,
                 paymentMethod,
                 confirmationCode,
                 statusDescription
             );

             if (!updatedPayment) {
                 console.warn(`IPN Update Warning: No DB record found for tracking ID ${OrderTrackingId}. Was it created?`);
                 // Log this, might indicate a race condition or issue in initiate step
             } else {
                console.log(`IPN - DB status updated successfully for ${OrderTrackingId} to ${internalStatus}`);

                // --- Trigger Post-Payment Actions ONLY on Successful Update & COMPLETED Status ---
                if (internalStatus === 'COMPLETED') {
                    console.log(`IPN - Triggering post-completion actions for ${OrderTrackingId} (Merchant Ref: ${OrderMerchantReference})`);

                    // Add your business logic here:
                    // - Grant user access (fetch user ID from updatedPayment if needed)
                    // await grantUserAccess(updatedPayment.user_id);
                    // - Fulfill order / trigger shipping
                    // await fulfillOrder(OrderMerchantReference); // Use your reference ID
                    // - Send confirmation email
                    // await sendPaymentConfirmationEmail(updatedPayment.customer_email, OrderMerchantReference, updatedPayment.amount);

                    // Handle RECURRING specific logic if needed
                    if (OrderNotificationType === 'RECURRING') {
                        console.log(`IPN - Processing RECURRING payment logic for ${OrderTrackingId}`);
                        // Maybe update subscription status, log recurring payment specifically
                    }
                } else {
                     console.log(`IPN - Payment ${OrderTrackingId} status is ${internalStatus}, no completion actions triggered.`);
                     // Handle FAILED/REVERSED cases if needed (e.g., send notification)
                }
                // --- End Post-Payment Actions ---
             }

        } catch (error) {
            console.error(`IPN Async Processing Error for ${OrderTrackingId}:`, error.response?.data || error.message, error.stack);
            // Implement monitoring/alerting for failed IPN processing
            // Consider adding retry logic with exponential backoff for transient errors (network, Pesapal API down)
        }
    }); // End setImmediate

} // End handler