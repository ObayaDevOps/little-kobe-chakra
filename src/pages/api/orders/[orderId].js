import { getServerSupabaseClient } from '@/lib/supabaseClient'; // Adjust path if needed

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { orderId } = req.query;

    if (!orderId) {
        return res.status(400).json({ message: 'Order ID is required.' });
    }

    const supabase = getServerSupabaseClient({ req, res });

    try {
        console.log(`Fetching details for order ID: ${orderId}`);

        // 1. Fetch the main order details
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select(`
                id,
                created_at,
                status,
                customer_email,
                customer_phone,
                total_amount,
                currency,
                shipping_address
            `)
            .eq('id', orderId)
            .maybeSingle(); // Expect one or zero orders

        if (orderError) {
            console.error(`Supabase error fetching order ${orderId}:`, orderError);
            throw orderError; // Rethrow to be caught by outer catch
        }

        if (!orderData) {
            return res.status(404).json({ message: `Order with ID ${orderId} not found.` });
        }

        // 2. Fetch the associated order items
        // Assumes 'product_name' is denormalized on order_items.
        // If not, you'd need another join to 'inventory' here or fetch separately.
        const { data: itemsData, error: itemsError } = await supabase
            .from('order_items')
            .select(`
                product_id,
                quantity,
                unit_price_at_purchase,
                total_item_price,
                product_name
            `)
            .eq('order_id', orderId);

        if (itemsError) {
            console.error(`Supabase error fetching items for order ${orderId}:`, itemsError);
            throw itemsError; // Rethrow
        }

        // 3. Combine the data
        const fullOrderDetails = {
            ...orderData,
            items: itemsData || [],
        };

        console.log(`Successfully fetched details for order ${orderId}`);
        res.status(200).json(fullOrderDetails);

    } catch (error) {
        console.error(`Error fetching order details for ${orderId}:`, error);
        res.status(500).json({ message: 'Internal Server Error', details: error.message });
    }
} 