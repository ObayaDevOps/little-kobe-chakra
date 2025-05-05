// pages/api/sync/inventory.js (or app/api/sync/inventory/route.js)
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase client with Service Role Key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get the secret from environment variables
const SANITY_WEBHOOK_SECRET = process.env.SANITY_WEBHOOK_SECRET;

// Helper function to verify the signature
async function verifySignature(req) {
    const signature = req.headers['sanity-signature'];
    if (!signature) {
        console.error('Missing sanity-signature header');
        return false;
    }

    // Reconstruct the body string from the raw buffer
    // Note: Next.js might parse the body automatically. We need the raw body.
    // Configure API route to disable body parsing or use a different method
    // to access the raw body if needed.
    // For Pages Router:
    const rawBody = await getRawBody(req);

    // For App Router, the request object might handle this differently.
    // Check Next.js docs for accessing raw request body in Route Handlers.
    // Example for App Router might look like:
    // const rawBody = await req.text();

    try {
        const hash = crypto
            .createHmac('sha256', SANITY_WEBHOOK_SECRET)
            .update(rawBody) // Use the raw string body
            .digest('hex');

        if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(hash))) {
             return true; // Signatures match
         } else {
            console.error('Invalid signature');
            return false;
         }
    } catch (error) {
        console.error('Error verifying signature:', error);
        return false;
    }
}

// Helper to get raw body (needed for Pages Router)
// Install 'raw-body' if needed: npm install raw-body
// import getRawBody from 'raw-body';
// export const config = { api: { bodyParser: false } }; // Disable default body parser

// --- Handler Logic (Example for Pages Router) ---
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        console.log('Received non-POST request');
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // --- Verification (Add back when ready) ---
    /*
    if (!SANITY_WEBHOOK_SECRET) {
         console.error("Missing SANITY_WEBHOOK_SECRET");
         return res.status(500).json({ message: 'Internal Server Error: Missing Secret Config' });
    }
    const rawBody = await getRawBody(req); // Or req.text() for App Router
    const isValid = await verifySignature(req, rawBody); // Pass rawBody to verify
     if (!isValid) {
        return res.status(401).json({ message: 'Invalid signature' });
     }
    // If verification is enabled & successful, parse the body manually:
    // const body = JSON.parse(rawBody.toString('utf-8'));
    */
    // --- Use default parsed body if verification is skipped/bodyParser not disabled ---
    const body = req.body;

    // --- Process Webhook Request ---
    // Destructure all fields from the new projection, including 'operation'
    const { _id: productId, quantity, name, categoryName, price, operation } = body;

    // Check if product ID and operation type exist
    if (!productId || !operation) {
        console.log('Webhook received invalid payload (missing _id or operation):', body);
        return res.status(400).json({ message: 'Bad Request: Missing _id or operation type' });
    }

    // Use the explicit operation field to determine the action
    if (operation === 'delete') {
        // --- Handle Delete Operation ---
        console.log(`Webhook received: Delete product ${productId} (Operation: ${operation})`);
        try {
            const { error: deleteError } = await supabase
                .from('inventory')
                .delete()
                .match({ product_id: productId });

            if (deleteError) {
                console.error(`Supabase delete error for ${productId}:`, deleteError);
                if (deleteError.code === 'PGRST116') {
                     console.log(`Product ${productId} not found in inventory for deletion.`);
                     return res.status(200).json({ message: 'Product not found or already deleted' });
                }
                return res.status(500).json({ message: 'Error deleting inventory item', error: deleteError.message });
            }

            console.log(`Successfully deleted product ${productId} from Supabase inventory.`);
            return res.status(200).json({ message: 'Inventory item deleted successfully' });

        } catch (err) {
            console.error(`Unexpected error processing delete webhook for ${productId}:`, err);
            return res.status(500).json({ message: 'Internal Server Error during delete' });
        }

    } else if (operation === 'create' || operation === 'update') {
        // --- Handle Create/Update Operation (Upsert) ---

        // Validate fields required specifically for create/update
        if (quantity === undefined || quantity === null || price === undefined || price === null) {
             console.log(`Webhook received invalid ${operation} payload (missing quantity or price):`, body);
             return res.status(400).json({ message: `Bad Request: Missing quantity or price for ${operation}` });
        }
        if (!name) {
           console.log(`Webhook received ${operation} payload missing name:`, body);
           // return res.status(400).json({ message: `Bad Request: Missing name for ${operation}` });
        }
         if (!categoryName) {
            console.log(`Webhook received ${operation} payload missing categoryName:`, body);
            // return res.status(400).json({ message: `Bad Request: Missing categoryName for ${operation}` });
         }
         if (typeof price !== 'number' || price < 0) {
            console.log(`Webhook received invalid price for ${operation}:`, body);
            return res.status(400).json({ message: `Bad Request: Invalid price value for ${operation}` });
         }

        console.log(`Webhook received: ${operation} product ${productId} (Name: ${name || 'N/A'}, Category: ${categoryName || 'N/A'}, Price: ${price}) to quantity ${quantity}`);

        try {
            const upsertData = {
                product_id: productId,
                quantity: quantity,
                name: name,
                category: categoryName,
                price: price,
                min_stock_level: 0,
            };

            console.log('Upserting data to Supabase:', upsertData);

        const { data, error } = await supabase
            .from('inventory')
                .upsert(upsertData, { onConflict: 'product_id' })
                .select();

        if (error) {
                console.error(`Supabase upsert error for ${productId} (${operation}):`, error);
            return res.status(500).json({ message: 'Error updating inventory', error: error.message });
        }

            console.log(`Successfully synced product ${productId} (${operation}) in Supabase. Result:`, data);
        return res.status(200).json({ message: 'Inventory updated successfully' });

    } catch (err) {
            console.error(`Unexpected error processing ${operation} webhook for ${productId}:`, err);
            return res.status(500).json({ message: `Internal Server Error during ${operation}` });
        }
    } else {
        // Handle unexpected operation values
        console.warn(`Webhook received unknown operation type '${operation}' for ${productId}:`, body);
        return res.status(400).json({ message: `Bad Request: Unknown operation type '${operation}'` });
    }
}

// --- App Router equivalent structure (app/api/sync/inventory/route.js) ---
/*
import { NextResponse } from 'next/server';
// ... other imports (supabase, crypto)

export async function POST(req) {
    // ... Implement signature verification using req.headers.get('sanity-signature') and await req.text() for raw body

    const { _id: productId, quantity } = await req.json(); // Parse JSON body

    // ... rest of the validation and Supabase upsert logic ...

    // Use NextResponse for responses
    // return NextResponse.json({ message: 'Inventory updated successfully' }, { status: 200 });
    // return NextResponse.json({ message: 'Error message' }, { status: 500 });
}
*/

// --- NOTE on Raw Body for Pages Router ---
// If using Pages Router, you need `export const config = { api: { bodyParser: false } };`
// and use a library like `raw-body` to get the buffer/string for signature verification.
// Then, AFTER verification, you can parse the raw body string as JSON: `JSON.parse(rawBody.toString('utf-8'))`.