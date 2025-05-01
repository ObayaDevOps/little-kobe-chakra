import supabaseAdmin from '@/lib/supabaseAdmin';
import sanityClient from '@/lib/sanityClient'; // Needed to map product IDs back to names

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }

    // Optional: Add date range filtering (e.g., ?startDate=...&endDate=...)
    // const { startDate, endDate } = req.query;

    try {
        // --- Assumptions about your schema ---
        // 1. 'orders' table: has 'id', 'created_at'
        // 2. 'order_items' table: has 'order_id' (FK to orders.id),
        //    'product_id' (FK to inventory.product_id / Sanity _id), 'quantity', 'price' (price per item at time of sale)

        // Example: Get total sales quantity per product
        const { data: salesData, error: salesError } = await supabaseAdmin
            .from('order_items')
            .select(`
                product_id,
                quantity
            `);
            // Add date filtering if needed:
            // .gte('created_at', startDate)
            // .lte('created_at', endDate);

        if (salesError) {
            console.error('Supabase sales fetch error:', salesError);
            return res.status(500).json({ message: 'Error fetching sales data.', error: salesError.message });
        }

        // Aggregate sales data
        const aggregatedSales = salesData.reduce((acc, item) => {
            if (!acc[item.product_id]) {
                acc[item.product_id] = { productId: item.product_id, totalQuantity: 0 };
            }
            acc[item.product_id].totalQuantity += item.quantity;
            return acc;
        }, {});

        // Fetch product names from Sanity to make the report more readable
        const productIds = Object.keys(aggregatedSales);
        if (productIds.length > 0) {
            const sanityQuery = `*[_id in $ids]{ _id, "name": name }`; // Adjust 'name' field
            const sanityParams = { ids: productIds };
            const productNames = await sanityClient.fetch(sanityQuery, sanityParams);
            const nameMap = new Map(productNames.map(p => [p._id, p.name]));

            // Add names to the aggregated data
             Object.values(aggregatedSales).forEach(item => {
                item.productName = nameMap.get(item.productId) || 'Unknown Product';
            });
        }


        // Format for charting (example: array suitable for bar chart)
        const chartData = Object.values(aggregatedSales).map(item => ({
            label: item.productName,
            value: item.totalQuantity,
            productId: item.productId, // Include ID if needed for drill-down
        }));

        res.status(200).json(chartData);

    } catch (error) {
        console.error('Error generating sales report:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
} 