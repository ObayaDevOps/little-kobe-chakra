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

    // --- Verification (Adjust based on raw body access) ---
    // This part needs careful implementation depending on Pages vs App Router
    // For now, assuming you have a way to get the rawBody:
    /*
    if (!SANITY_WEBHOOK_SECRET) {
         console.error("Missing SANITY_WEBHOOK_SECRET");
         return res.status(500).json({ message: 'Internal Server Error: Missing Secret Config' });
    }
     // const isValid = await verifySignature(req); // Implement based on raw body access
     // if (!isValid) {
     //    return res.status(401).json({ message: 'Invalid signature' });
     // }
    */
    // --- TEMPORARY: Skip verification during initial dev, BUT ADD IT! ---
    console.warn("Webhook signature verification skipped for development!");

    // --- Process Validated Request ---
    // If verification passed (or skipped), parse the body (Next.js does this by default if bodyParser is not disabled)
    const { _id: productId, quantity } = req.body;

    if (!productId || quantity === undefined || quantity === null) {
        console.log('Webhook received invalid payload:', req.body);
        return res.status(400).json({ message: 'Bad Request: Missing _id or quantity' });
    }

    console.log(`Webhook received: Sync product ${productId} to quantity ${quantity}`);

    try {
        const { data, error } = await supabase
            .from('inventory')
            .upsert(
                { product_id: productId, quantity: quantity },
                { onConflict: 'product_id' } // Use Sanity _id as the conflict target
            )
            .select(); // Select to see the result

        if (error) {
            console.error(`Supabase upsert error for ${productId}:`, error);
            // Decide if you want to retry or just log
            return res.status(500).json({ message: 'Error updating inventory', error: error.message });
        }

        console.log(`Successfully synced product ${productId} to quantity ${quantity} in Supabase. Result:`, data);
        return res.status(200).json({ message: 'Inventory updated successfully' });

    } catch (err) {
        console.error(`Unexpected error processing webhook for ${productId}:`, err);
        return res.status(500).json({ message: 'Internal Server Error' });
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