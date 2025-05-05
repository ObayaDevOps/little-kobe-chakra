import { getServerSupabaseClient } from '@/lib/supabaseClient'; // Adjust path if needed
import { subDays, startOfDay, endOfDay, parseISO } from 'date-fns'; // Date library

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // Get Supabase client for the server route
    const supabase = getServerSupabaseClient({ req, res }); // Pass req/res if needed for auth later

    // --- Date Range Handling ---
    // Get date range from query parameters, default to last 30 days
    const { startDate: startDateQuery, endDate: endDateQuery } = req.query;

    let startDate;
    let endDate;

    try {
        // Default end date is the end of today
        endDate = endDateQuery ? endOfDay(parseISO(endDateQuery)) : endOfDay(new Date());
        // Default start date is 30 days before the end date
        startDate = startDateQuery ? startOfDay(parseISO(startDateQuery)) : startOfDay(subDays(endDate, 29)); // Default 30-day period including end date

        // Basic validation: ensure start date is not after end date
        if (startDate > endDate) {
            return res.status(400).json({ message: 'Start date cannot be after end date.' });
        }

    } catch (error) {
        console.error("Error parsing date parameters:", error);
        return res.status(400).json({ message: 'Invalid date format. Please use YYYY-MM-DD.' });
    }

    // --- Call the Supabase Function ---
    try {
        console.log(`Calling get_sales_overview with range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

        const { data, error } = await supabase.rpc('get_sales_overview', {
            p_start_date: startDate.toISOString(),
            p_end_date: endDate.toISOString(),
        });

        if (error) {
            console.error('Supabase RPC error calling get_sales_overview:', error);
            // Check if the error message is from our EXCEPTION block
            if (data?.error) {
                 return res.status(500).json({ message: `Database function error: ${data.error}` });
            }
            return res.status(500).json({ message: 'Error fetching sales overview data.', details: error.message });
        }

        if (!data) {
             console.warn('No data returned from get_sales_overview for the specified range.');
             // Return empty/zeroed data structure consistent with the function's error return
            return res.status(200).json({
                totalSales: 0,
                totalOrders: 0,
                averageOrderValue: 0,
                totalItemsSold: 0,
                salesTrend: [],
                ordersTrend: [],
            });
        }

        console.log('Successfully fetched sales overview data.');
        // The data returned by the RPC call is the JSONB object we built
        res.status(200).json(data);

    } catch (error) {
        console.error('Unexpected error in /api/analytics/overview:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
} 