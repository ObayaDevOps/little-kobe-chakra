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

    if (!orderTrackingId || typeof orderTrackingId !== 'string') {
        return res.status(400).json({ message: 'Missing or invalid orderTrackingId' });
    }

    console.log(`Verification request received for tracking ID: ${orderTrackingId}`);

    try {
        // 1. Check current status in DB (Optional but recommended)
        // Use the imported Supabase function
        const existingPayment = await getPaymentByTrackingId(orderTrackingId);

        if (existingPayment?.status === 'COMPLETED') {
            console.log(`Payment ${orderTrackingId} already marked COMPLETED in DB. Skipping Pesapal check.`);
            return res.status(200).json({
                 status: 'COMPLETED',
                 statusDescription: existingPayment.pesapal_status_description || 'Already completed',
                 confirmationCode: existingPayment.pesapal_confirmation_code
            });
        }
        // Add checks for FAILED, REVERSED etc. if you don't want to re-verify them

        // 2. Get Fresh Pesapal Token
        const token = await getPesapalToken();

        // 3. Call Pesapal GetTransactionStatus
        console.log(`Querying Pesapal status for ${orderTrackingId}`);
        const statusResponse = await axios.get(
            `${PESAPAL_BASE_URL}/Transactions/GetTransactionStatus`,
            {
                params: { orderTrackingId }, // Correctly passed as query param
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json', // Still required by API docs
                },
            }
        );

        // 4. Handle Pesapal Response Error
        if (statusResponse.data.error?.code) {
            console.error(`Pesapal status check API error for ${orderTrackingId}: ${statusResponse.data.error.code} - ${statusResponse.data.error.message}`);
            // Don't update DB status based on an API error, rely on IPN or retry later
            throw new Error(`Pesapal status check failed: ${statusResponse.data.error.message || statusResponse.data.error.code}`);
        }

        // 5. Map status and prepare data for DB update
        const pesapalStatusCode = statusResponse.data.status_code;
        const internalStatus = mapPesapalStatus(pesapalStatusCode);
        const confirmationCode = statusResponse.data.confirmation_code;
        const statusDescription = statusResponse.data.payment_status_description;
        const paymentMethod = statusResponse.data.payment_method; // Assuming you store this

        console.log(`Pesapal status for ${orderTrackingId}: Code=${pesapalStatusCode}, Internal=${internalStatus}, ConfCode=${confirmationCode}`);

        // 6. Update Supabase DB record
        // Use the imported Supabase function
        // Important: Pass Pesapal's tracking ID to find the record
        const updatedPayment = await updatePaymentStatus(
            orderTrackingId,
            internalStatus,
            paymentMethod, // Adjust if your function expects this
            confirmationCode,
            statusDescription
        );

        if (!updatedPayment) {
             console.warn(`Verification update failed: No record found in DB for tracking ID ${orderTrackingId}. IPN might handle it.`);
             // Respond with Pesapal's status but indicate DB issue? Or just Pesapal status?
             // Let's respond with Pesapal status for frontend consistency, but log the warning.
        } else {
            console.log(`DB status updated successfully for ${orderTrackingId} to ${internalStatus}`);
        }

        // 7. Respond to your frontend callback page
        res.status(200).json({
            status: internalStatus,
            statusDescription: statusDescription || 'Status updated',
            confirmationCode: confirmationCode // Send back if needed by frontend
         });

    } catch (error) {
        console.error(`Error verifying payment status for ${orderTrackingId}:`, error.response?.data || error.message, error.stack);
        // Avoid updating DB status on error here; let IPN be the source of truth if verification fails
        res.status(500).json({ message: error.message || 'Failed to verify payment status.' });
    }
}