// lib/db.js
import { getServerSupabaseClient } from './supabaseClient';

// --- Payment Creation ---
export async function createPendingPayment(paymentData) {
    const supabase = getServerSupabaseClient();
    const { data, error } = await supabase
        .from('payments')
        .insert([
            {
                // user_id: paymentData.user_id, // Include if using auth
                merchant_reference: paymentData.merchant_reference,
                amount: paymentData.amount,
                currency: paymentData.currency,
                description: paymentData.description,
                status: 'PENDING', // Explicitly set
                customer_email: paymentData.customer_email,
                customer_phone: paymentData.customer_phone,
                ipn_id_used: paymentData.ipn_id_used,
                callback_url_used: paymentData.callback_url_used,
                // created_at and updated_at have defaults
            },
        ])
        .select() // Return the created record
        .single(); // Expecting only one record back

    if (error) {
        console.error('Supabase error creating payment:', error);
        throw new Error(`Supabase error: ${error.message}`);
    }
    if (!data) {
        throw new Error('Failed to create payment record in database.');
    }
    return data; // Return the full payment record including the generated id
}

// --- Update with Pesapal Tracking ID ---
export async function updatePaymentTrackingId(paymentId, pesapalTrackingId) {
    const supabase = getServerSupabaseClient();
    const { error } = await supabase
        .from('payments')
        .update({
             pesapal_tracking_id: pesapalTrackingId,
             // updated_at will auto-update via trigger
         })
        .eq('id', paymentId); // Use the internal DB ID

    if (error) {
        console.error('Supabase error updating tracking ID:', error);
        // Decide if this should throw or just log, depending on criticality
    }
}


// --- Update Payment Status (from Verification or IPN) ---
export async function updatePaymentStatus(
    pesapalTrackingId, // Use this to find the record
    internalStatus,
    paymentMethod,
    confirmationCode,
    statusDescription
) {
    const supabase = getServerSupabaseClient();
    const updateData = {
        status: internalStatus,
        pesapal_confirmation_code: confirmationCode || null,
        pesapal_status_description: statusDescription || null,
        last_checked_at: new Date().toISOString(), // Record when we last checked
        // updated_at will auto-update via trigger
    };

    // Add paymentMethod if you have a column for it (recommended)
    // if (paymentMethod) updateData.payment_method_used = paymentMethod;

     console.log(`Updating payment status for tracking ID ${pesapalTrackingId} to ${internalStatus}`);

    const { data, error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('pesapal_tracking_id', pesapalTrackingId) // Find by Pesapal's ID
        .select() // Optionally return the updated record
        .single();

    if (error) {
        console.error(`Supabase error updating status for ${pesapalTrackingId}:`, error);
        throw new Error(`Supabase update error: ${error.message}`); // Throw to indicate IPN processing failure
    }
     if (!data) {
         console.warn(`No payment record found to update for tracking ID: ${pesapalTrackingId}`);
         // Don't throw, maybe the IPN came before initiate finished saving? Log it.
         // Or maybe it's a duplicate IPN for an already processed transaction.
     }
    return data; // Return updated record or null if not found
}

// --- Get Payment Record (e.g., for checking before redundant updates) ---
export async function getPaymentByTrackingId(pesapalTrackingId) {
     const supabase = getServerSupabaseClient();
    const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('pesapal_tracking_id', pesapalTrackingId)
        .maybeSingle(); // Use maybeSingle as it might not exist yet

    if (error) {
        console.error(`Supabase error getting payment by tracking ID ${pesapalTrackingId}:`, error);
        // Decide how to handle read errors
    }
    return data; // Returns the record or null
}

// Add other functions as needed (e.g., getPaymentByMerchantReference)