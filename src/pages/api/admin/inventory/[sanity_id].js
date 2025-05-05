// import supabaseAdmin from '@/lib/supabaseAdmin';
import supabaseAdmin from '../../../../lib/supabaseClient';

import { getAllInventoryItemById } from '../../../../lib/db';


export default async function handler(req, res) {
    const { sanity_id } = req.query; // Get the Sanity product ID from the URL

    if (!sanity_id) {
        return res.status(400).json({ message: 'Missing Sanity product ID.' });
    }




    // --- Handle GET Request (Fetch single item) ---
    if (req.method === 'GET') {
        try {
            // Fetch the item using your helper function
            const { data: inventoryData, error: supabaseError } = await getAllInventoryItemById(sanity_id);
            console.log('FROM SUPABASE - Data:', inventoryData, 'Error:', supabaseError); // Log both

            // 1. Check the CORRECT error variable returned from the function call
            if (supabaseError) {
                console.error('Supabase fetch error reported:', supabaseError);
                return res.status(500).json({ message: 'Database error fetching inventory data.', error: supabaseError.message || 'Unknown database error' });
            }

            // 2. Check if data was actually found (assuming getAllInventoryItemById returns null/empty array if not found)
            // Adjust this check based on what getAllInventoryItemById returns when not found
             if (!inventoryData || (Array.isArray(inventoryData) && inventoryData.length === 0)) {
                 console.log(`Inventory item with Sanity ID ${sanity_id} not found in database.`);
                 return res.status(404).json({ message: `Inventory item with Sanity ID ${sanity_id} not found.` });
            }

            // 3. Data exists and no error. Format it.
            // Assuming inventoryData is an array with one item, access it at index 0
            // If getAllInventoryItemById returns a single object, remove [0]
            const item = Array.isArray(inventoryData) ? inventoryData[0] : inventoryData;

            if (!item) { // Double-check after potential array access
                 console.log(`Inventory item data is unexpectedly empty after array check.`);
                 return res.status(404).json({ message: `Inventory item with Sanity ID ${sanity_id} not found.` });
            }

            const formattedData = {
                id: item.id, // Use item.id if it exists in the returned data
                sanityId: item.product_id, // Use item.product_id
                // Add other fields from 'item' - make sure these exist in the data from getAllInventoryItemById
                name: item.name ?? null, // Add nullish coalescing for safety
                price: item.price,
                quantity: item.quantity,
                minStockLevel: item.min_stock_level,
                imageUrl: item.image_url ?? null,
            };
            console.log('formattedData:', formattedData);

            return res.status(200).json(formattedData); // Send the formatted item data

        } catch (error) {
            console.error('GET /api/admin/inventory/[sanity_id] caught exception:', error);
            return res.status(500).json({ message: 'Failed to process fetch inventory request', error: error.message });
        }
    }

    // --- Handle PUT/PATCH Request (Update/Upsert item) ---
    else if (req.method === 'PUT' || req.method === 'PATCH') {
        const { price, quantity, min_stock_level } = req.body; // Get data to update

        // Basic validation: Ensure at least one field is being updated
        if (price === undefined && quantity === undefined && min_stock_level === undefined) {
            return res.status(400).json({ message: 'No update data provided (price, quantity, or min_stock_level).' });
        }

        try {
            // Construct the data object for Supabase, only including provided fields
            const updateData = {};
            // Add validation here if needed (e.g., ensure price/quantity are numbers)
            if (price !== undefined) updateData.price = price;
            if (quantity !== undefined) updateData.quantity = quantity;
            if (min_stock_level !== undefined) updateData.min_stock_level = min_stock_level;

            const { data, error } = await supabaseAdmin
                .from('inventory')
                .upsert(
                    {
                        product_id: sanity_id, // Match/Set the link to Sanity's _id
                        ...updateData,         // Add the fields to update/insert
                    },
                    {
                        onConflict: 'product_id', // Specify the column to check for conflicts
                    }
                )
                .select() // Return the updated/inserted row
                .single(); // Expecting a single row result

            if (error) {
                console.error('Supabase upsert error:', error);
                return res.status(500).json({ message: 'Failed to update inventory.', error: error.message });
            }

            res.status(200).json({ message: 'Inventory updated successfully.', data });

        } catch (error) {
            console.error('Error updating inventory:', error);
            res.status(500).json({ message: 'Internal Server Error', error: error.message });
        }
    }

    // --- Handle other methods ---
    else {
        // Update the Allow header to include GET
        res.setHeader('Allow', ['GET', 'PUT', 'PATCH']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
} 