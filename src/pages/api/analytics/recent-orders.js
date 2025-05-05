import { getServerSupabaseClient } from '@/lib/supabaseClient'; // Adjust path if needed

const ORDERS_PER_PAGE = 15; // Number of orders to fetch per request

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const supabase = getServerSupabaseClient({ req, res });

    // --- Pagination ---
    // Get page number from query, default to 1
    const page = parseInt(req.query.page, 10) || 1;
    if (page < 1) {
        return res.status(400).json({ message: 'Page number must be 1 or greater.' });
    }
    const startIndex = (page - 1) * ORDERS_PER_PAGE;
    const endIndex = startIndex + ORDERS_PER_PAGE - 1;

    try {
        console.log(`Fetching recent orders, page: ${page}`);

        // Query the 'orders' table
        const { data, error, count } = await supabase
            .from('orders')
            .select(`
                id,
                created_at,
                status,
                customer_email,
                total_amount,
                currency
            `, { count: 'exact' }) // Fetch total count for pagination metadata
            .order('created_at', { ascending: false }) // Order by most recent first
            .range(startIndex, endIndex); // Apply pagination range

        if (error) {
            console.error('Supabase error fetching recent orders:', error);
            return res.status(500).json({ message: 'Error fetching recent orders.', details: error.message });
        }

        // Calculate total pages
        const totalPages = Math.ceil(count / ORDERS_PER_PAGE);

        console.log(`Successfully fetched ${data?.length || 0} orders. Total count: ${count}`);

        res.status(200).json({
            orders: data || [],
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalOrders: count,
                perPage: ORDERS_PER_PAGE,
            },
        });

    } catch (error) {
        console.error('Unexpected error in /api/analytics/recent-orders:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
