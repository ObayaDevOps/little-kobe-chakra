// import supabaseAdmin from '@/lib/supabaseAdmin';
import supabaseAdmin from '../../../../lib/supabaseClient';


export default async function handler(req, res) {
    if (req.method !== 'PUT' && req.method !== 'PATCH') {
        res.setHeader('Allow', ['PUT', 'PATCH']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }

    const { sanity_id } = req.query; // Get the Sanity product ID from the URL
    const { price, quantity, min_stock_level } = req.body; // Get data to update

    if (!sanity_id) {
        return res.status(400).json({ message: 'Missing Sanity product ID.' });
    }

    // Basic validation: Ensure at least one field is being updated
    if (price === undefined && quantity === undefined && min_stock_level === undefined) {
        return res.status(400).json({ message: 'No update data provided (price, quantity, or min_stock_level).' });
    }

    try {
        // Construct the data object for Supabase, only including provided fields
        const updateData = {};
        if (price !== undefined) updateData.price = price;
        if (quantity !== undefined) updateData.quantity = quantity;
        if (min_stock_level !== undefined) updateData.min_stock_level = min_stock_level;

        // Use upsert: updates if product_id matches, otherwise inserts a new row.
        // The `product_id` is crucial for matching and for the insert case.
        const { data, error } = await supabaseAdmin
            .from('inventory')
            .upsert(
                {
                    product_id: sanity_id, // Match/Set the link to Sanity's _id
                    ...updateData,         // Add the fields to update/insert
                    // updated_at is handled automatically by Supabase trigger/default
                },
                {
                    onConflict: 'product_id', // Specify the column to check for conflicts
                     // default is false. Set to true to ignore duplicates instead of updating
                     // ignoreDuplicates: false,
                }
            )
            .select() // Return the updated/inserted row
            .single(); // Expecting a single row result

        if (error) {
            console.error('Supabase upsert error:', error);
            // Check for specific errors if needed, e.g., constraint violations
            return res.status(500).json({ message: 'Failed to update inventory.', error: error.message });
        }

        res.status(200).json({ message: 'Inventory updated successfully.', data });

    } catch (error) {
        console.error('Error updating inventory:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
} 