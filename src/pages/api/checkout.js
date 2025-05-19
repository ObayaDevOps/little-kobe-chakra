// pages/api/checkout.js (or app/api/checkout/route.js)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// --- Handler Logic (Example for Pages Router) ---
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // Assume cart items are sent in the request body
    // Example format: [{ productId: 'sanity_doc_id_1', requestedQuantity: 2 }, ...]
    const cartItems = req.body.items;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        return res.status(400).json({ message: 'Bad Request: Invalid or empty cart items' });
    }

    // --- 1. Attempt to Decrement Stock for all items ---
    // We ideally want this whole check/decrement phase to be atomic,
    // but doing it across multiple products in one *database* transaction
    // without complex locking can be tricky. Calling the function sequentially
    // is often simpler, relying on the function's row-level lock.
    // If one fails, we need to signal failure immediately.

    //TODO: OD - The check for 'stock quanity > 0' and the decrementing of stock should be separate
    // The Decrement should only occur when payment has been comnfirmed in 'callback.js'

    const decrementPromises = cartItems.map(item => {
        console.log(`Attempting to decrement stock for ${item.productId} by ${item.requestedQuantity}`);
        return supabase.rpc('decrement_stock', {
            p_id: item.productId,
            amount: item.requestedQuantity,
        });
        // Note: .rpc returns { data, error }
    });

    try {
        const results = await Promise.all(decrementPromises);

        // Check if any decrement operation failed
        for (let i = 0; i < results.length; i++) {
            const { data, error } = results[i];
            const item = cartItems[i];
            if (error) {
                console.error(`Failed to decrement stock for ${item.productId}:`, error.message);
                // Specific check for insufficient stock error message from our function
                if (error.message.includes('Insufficient stock')) {
                     return res.status(409).json({ // 409 Conflict is suitable here
                        message: `Insufficient stock for product (ID: ${item.productId}). Please update your cart.`,
                        error: 'INSUFFICIENT_STOCK',
                        productId: item.productId,
                    });
                } else if (error.message.includes('not found in inventory')) {
                     return res.status(404).json({
                        message: `Product (ID: ${item.productId}) not found in inventory system.`,
                        error: 'PRODUCT_NOT_FOUND',
                        productId: item.productId,
                    });
                }
                // Generic server error for other DB issues
                return res.status(500).json({ message: 'Database error during stock check.', error: error.message });
            }
             console.log(`Successfully decremented stock for ${item.productId}. New quantity: ${data}`);
        }

        // --- 2. Stock Secured - Proceed with Order Creation & Payment ---
        console.log('All stock checks passed and quantities decremented.');

        // TODO: Create the Order record in your database (e.g., a Supabase 'orders' table)
        // This should ideally happen *before* charging the customer.
        // Example:
        // const { data: orderData, error: orderError } = await supabase
        //   .from('orders')
        //   .insert([{ user_id: /* get user id */, items: cartItems, total: /* calculate total */ }])
        //   .select();
        // if (orderError) { /* Handle order creation error - potentially need to rollback stock! */ }

        // TODO: Initiate Payment Processing (e.g., Stripe, PayPal)
        // Pass the order ID and amount to the payment gateway.
        const paymentIntent = { id: 'pi_test_123', status: 'succeeded', amount: 1000 }; // Placeholder

        // --- 3. Handle Payment Result ---
        if (paymentIntent.status === 'succeeded') {
            // TODO: Update Order status to 'paid' or 'processing'
            console.log(`Payment successful for order. Amount: ${paymentIntent.amount}`);
            return res.status(200).json({ success: true, orderId: /* orderData[0].id */ 'ORDER_123', paymentIntentId: paymentIntent.id });
        } else {
            // Payment failed AFTER stock was decremented. This is tricky.
            // Ideally, you'd try to *increment* the stock back. This requires an 'increment_stock' function
            // or careful manual UPDATEs. This adds complexity.
            // Alternatively, some payment flows allow authorization first, then capture after stock check.
            console.error(`Payment failed after stock decrement for order. Status: ${paymentIntent.status}`);
            // TODO: Attempt to rollback stock increments here (best effort)
            return res.status(402).json({ message: 'Payment Failed', error: 'PAYMENT_FAILED' }); // 402 Payment Required might fit
        }

    } catch (error) {
         // Catch errors from Promise.all itself or unexpected issues
        console.error('Unexpected error during checkout process:', error);
        // TODO: Consider stock rollback if partial decrements occurred before the error.
        return res.status(500).json({ message: 'Internal Server Error during checkout.' });
    }
}

// --- App Router equivalent structure (app/api/checkout/route.js) ---
/*
import { NextResponse } from 'next/server';
// ... other imports

export async function POST(req) {
    const body = await req.json();
    const cartItems = body.items;

    // ... rest of the logic using NextResponse for responses ...
}
*/