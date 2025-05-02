// lib/db.js
import { getServerSupabaseClient } from './supabaseClient';

// --- Payment Creation ---
export async function createPendingPayment(paymentData) {
    const supabase = getServerSupabaseClient();
    const {
        merchant_reference,
        amount,
        currency,
        description,
        customer_email,
        customer_phone,
        ipn_id_used,
        callback_url_used,
        cart_items,
        deliveryDetails,
        user_id,
    } = paymentData;

    console.log(`Attempting to insert pending payment for merchant ref: ${merchant_reference}`);

    const { data, error } = await supabase
        .from('payments')
        .insert([
            {
                merchant_reference,
                amount,
                currency,
                description,
                status: 'PENDING',
                customer_email,
                customer_phone,
                ipn_id_used,
                callback_url_used,
                cart_items: cart_items,
                delivery_address: deliveryDetails,
            },
        ])
        .select()
        .single();

    if (error) {
        console.error(`Supabase error creating pending payment for ${merchant_reference}:`, error);
        if (error.message.includes('delivery_address')) {
            console.error("Potential issue with the 'delivery_address' column or data format.");
        }
        throw new Error(`Database error: ${error.message}`);
    }

    if (!data) {
        console.error(`Supabase returned no data after inserting payment for ${merchant_reference}`);
        throw new Error('Database error: Failed to create payment record.');
    }

    console.log(`Successfully inserted payment record ID: ${data.id}`);
    return data;
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

//Used in inventory
// --- Get Payment Record (e.g., for checking before redundant updates) ---
export async function getAllFromInventory() {
    console.log('ENTERED GET ALL FROM INVENTORY')
    const supabase = getServerSupabaseClient();
   const { data, error } = await supabase
       .from('inventory')
       .select('*');
    //    .maybeSingle(); // Use maybeSingle as it might not exist yet
    console.log('SUAPBASE DATA:', data);
    console.log('ERROR', error)

   if (!data) {
       console.error(`Supabase error getting all from inventory:`, error);
       // Decide how to handle read errors
   }
   return  { data, error }; // Returns the record or null
}


export async function getAllInventoryItemById(sanity_id) {
    console.log('ENTERED GET ALL FROM INVENTORY BY ID')
    const supabase = getServerSupabaseClient();
   const { data, error } = await supabase
       .from('inventory')
       .select('*')
       .eq('product_id', sanity_id);
    //    .maybeSingle(); // Use maybeSingle as it might not exist yet

    console.log('SUAPBASE DATA getAllInventoryItemById:', data);
    console.log('ERROR getAllInventoryItemById', error)

   if (!data) {
       console.error(`Supabase error getting all from inventory:`, error);
       // Decide how to handle read errors
   }
   return  { data, error }; // Returns the record or null
}


/**
 * Updates an inventory item in the database.
 * @param {string} sanityId - The Sanity ID of the product (maps to product_id).
 * @param {object} updates - An object containing the fields to update (e.g., { price, quantity, min_stock_level }).
 * @returns {Promise<{data: object|null, error: object|null}>} - The result of the update operation.
 */
export async function updateInventoryItem(sanityId, updates) {
    console.log(`Attempting to update inventory for product_id: ${sanityId} with data:`, updates);
    const supabase = getServerSupabaseClient();

    // Ensure numeric types are handled correctly, converting empty strings or invalid inputs to null
    const cleanUpdates = {
        price: updates.price === '' || isNaN(Number(updates.price)) ? null : Number(updates.price),
        quantity: updates.quantity === '' || isNaN(Number(updates.quantity)) ? null : Number(updates.quantity),
        min_stock_level: updates.minStockLevel === '' || isNaN(Number(updates.minStockLevel)) ? null : Number(updates.minStockLevel),
        // Add any other fields you might want to update here
    };

     // Remove null keys if Supabase should ignore them instead of setting to NULL
    // Object.keys(cleanUpdates).forEach(key => cleanUpdates[key] === null && delete cleanUpdates[key]);


    const { data, error } = await supabase
        .from('inventory')
        .update(cleanUpdates)
        .eq('product_id', sanityId) // Assuming 'product_id' column stores the sanity ID
        .select()
        .single();

    if (error) {
        console.error(`Supabase error updating inventory for product_id ${sanityId}:`, error);
    } else if (!data) {
         console.warn(`No inventory record found to update for product_id: ${sanityId}`);
    } else {
        console.log(`Successfully updated inventory for product_id: ${sanityId}`);
    }

    return { data, error };
}


// Add other functions as needed (e.g., getPaymentByMerchantReference)


/**
 * Fetches sales data aggregated by product ID for the sales report.
 * Optionally filters by date range in the future.
 * @param {object} options - Optional filtering options (e.g., { startDate, endDate }).
 * @returns {Promise<{data: Array<{product_id: string, quantity: number}>|null, error: object|null}>} - The raw sales data or an error.
 */
export async function getSalesDataForReport(options = {}) {
    const supabase = getServerSupabaseClient(); // Use the server client helper
    // const { startDate, endDate } = options; // For future date filtering

    console.log("Fetching sales data for report...");

    let query = supabase
        .from('order_items')
        .select(`
            product_id,
            quantity
        `);

    // Add date filtering if needed:
    // if (startDate) {
    //     query = query.gte('created_at', startDate); // Adjust column name if needed
    // }
    // if (endDate) {
    //     query = query.lte('created_at', endDate); // Adjust column name if needed
    // }

    const { data, error } = await query;

    if (error) {
        console.error('Supabase error fetching sales data for report:', error);
    } else {
        console.log(`Successfully fetched ${data?.length || 0} order items for sales report.`);
    }

    // Return the raw data and let the API route handle aggregation
    return { data, error };
}