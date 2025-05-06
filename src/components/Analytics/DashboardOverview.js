// src/components/Analytics/DashboardOverview.jsx
import React, { useState, useMemo } from 'react';
import {
    Box,
    Heading,
    SimpleGrid,
    Stat,
    StatLabel,
    StatNumber,
    // StatHelpText, // Keep if you add comparison text later
    // StatArrow, // Keep if you add comparison text later
    Spinner,
    Alert,
    AlertIcon,
    Flex,
    Spacer,
    Text, // <--- Import Text component
    FormControl, // Import FormControl
    FormLabel,   // Import FormLabel
    HStack,      // Import HStack for horizontal layout
    // Add components for Date Range Picker here (e.g., from react-datepicker or Chakra extensions)
    // Input, Button, etc.
    useTheme, // Import useTheme to access theme colors
} from '@chakra-ui/react';
import useSWR from 'swr';
import { format, subDays, startOfDay, endOfDay, parseISO } from 'date-fns'; // Added parseISO

// --- Import React Datepicker ---
import DatePicker from 'react-datepicker';
// --- Import React Datepicker CSS ---
// Make sure this CSS is imported somewhere in your project,
// often in your main app file (_app.js or similar) or directly here.
// If not imported globally, uncomment the next line:
import "react-datepicker/dist/react-datepicker.css";
// You might need custom CSS to make DatePicker inputs look more like Chakra inputs.
// See react-datepicker documentation for customization options.

// --- Import the new LineChart component ---
import LineChart from './LineChart'; // Adjust path if needed

// Helper function to fetch data using fetch API (required by SWR)
const fetcher = (url) => fetch(url).then((res) => {
    if (!res.ok) {
        // Attempt to parse error json for more specific message
        return res.json().then(errorBody => {
            const error = new Error(errorBody.message || `An error occurred while fetching the data (${res.status})`);
            error.status = res.status;
            throw error;
        });
    }
    return res.json();
});

// Helper to format currency (replace with a more robust library like Intl.NumberFormat if needed)
const formatCurrency = (value, currency = 'USD') => {
     // Basic placeholder - use Intl.NumberFormat for production
    const amount = Number(value || 0).toFixed(2);
     // You might want to fetch the actual currency from settings or order data
    // For now, let's just prepend KES as an example based on your previous code
    return `UGX ${amount}`;
};

const DashboardOverview = () => {
    // --- State for Date Range ---
    const [endDate, setEndDate] = useState(endOfDay(new Date())); // Use endOfDay for consistency
    const [startDate, setStartDate] = useState(() => {
         // Use startOfDay for consistency
        return startOfDay(subDays(new Date(), 29)); // Default to start of 30 days ago
    });

    // Format dates for the API query string
    const formattedStartDate = format(startDate, 'yyyy-MM-dd');
    const formattedEndDate = format(endDate, 'yyyy-MM-dd');

    // --- Data Fetching with SWR ---
    const apiUrl = `/api/analytics/overview?startDate=${formattedStartDate}&endDate=${formattedEndDate}`;
    const { data, error, isLoading } = useSWR(apiUrl, fetcher);

    // Access Chakra theme colors
    const theme = useTheme();
    const salesLineColor = theme.colors.blue[500] || 'steelblue'; // Use theme color or fallback
    const ordersLineColor = theme.colors.green[500] || 'green';

    // --- Pre-process data for charts (Memoized) ---
    // Ensure dates are parsed correctly for D3 time scales
    const processedSalesData = useMemo(() => {
        if (!data?.salesTrend) return [];
        return data.salesTrend.map(d => ({
            day: parseISO(d.day), // IMPORTANT: Parse string date to Date object
            sales: +d.sales // Ensure sales is a number
        }));
    }, [data?.salesTrend]);

    const processedOrdersData = useMemo(() => {
        if (!data?.ordersTrend) return [];
        return data.ordersTrend.map(d => ({
            day: parseISO(d.day), // IMPORTANT: Parse string date to Date object
            orders: +d.orders // Ensure orders is a number
        }));
    }, [data?.ordersTrend]);

    // --- Event Handlers for Date Picker ---
    const handleStartDateChange = (date) => {
        const newStartDate = startOfDay(date);
        if (newStartDate <= endDate) {
            setStartDate(newStartDate);
        } else {
            console.warn("Start date cannot be after end date.");
            // Provide feedback: e.g., toast notification
        }
    };
    const handleEndDateChange = (date) => {
        const newEndDate = endOfDay(date);
        if (newEndDate >= startDate) {
            setEndDate(newEndDate);
        } else {
            console.warn("End date cannot be before start date.");
            // Provide feedback: e.g., toast notification
        }
    };

    // --- Rendering Logic ---
    return (
        <Box p={5}>
            <Flex mb={6} direction={{ base: 'column', md: 'row' }} align="center">
                <Heading size="lg" mb={{ base: 4, md: 0 }}>Sales Overview</Heading>
                <Spacer />
                {/* --- Replace Placeholder with React Datepicker --- */}
                <HStack spacing={4}> {/* Use HStack for horizontal layout */}
                    <FormControl id="start-date">
                        <FormLabel fontSize="sm" mb={1}>Start Date</FormLabel>
                        <DatePicker
                            selected={startDate}
                            onChange={handleStartDateChange}
                            selectsStart
                            startDate={startDate}
                            endDate={endDate}
                            dateFormat="yyyy-MM-dd"
                            // Optional: Style the input - requires custom input component or global CSS targeting
                            // className="chakra-input" // Example class name (might need more specific styling)
                            // You might need to wrap DatePicker in a Box or use customInput prop for Chakra styling
                             customInput={<Box as="input" className="chakra-input" p={2} borderWidth="1px" borderRadius="md" width="150px" />} // Basic Chakra input styling
                        />
                    </FormControl>
                     <FormControl id="end-date">
                        <FormLabel fontSize="sm" mb={1}>End Date</FormLabel>
                         <DatePicker
                            selected={endDate}
                            onChange={handleEndDateChange}
                            selectsEnd
                            startDate={startDate}
                            endDate={endDate}
                            minDate={startDate} // Prevent end date before start date
                            dateFormat="yyyy-MM-dd"
                            // className="chakra-input"
                            customInput={<Box as="input" className="chakra-input" p={2} borderWidth="1px" borderRadius="md" width="150px" />} // Basic Chakra input styling
                        />
                    </FormControl>
                </HStack>
                 {/* --- End Datepicker --- */}
            </Flex>

            {/* Loading State */}
            {isLoading && (
                <Flex justify="center" align="center" height="200px">
                    <Spinner size="xl" />
                </Flex>
            )}

            {/* Error State */}
            {error && (
                <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    Error fetching overview data: {error.message}
                </Alert>
            )}

            {/* Data Display */}
            {data && !isLoading && !error && (
                <>
                    {/* KPI Grid */}
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={10}>
                        <Stat p={5} shadow="md" border="1px" borderColor="gray.200" borderRadius="md">
                            <StatLabel>Total Revenue</StatLabel>
                            <StatNumber>{formatCurrency(data.totalSales, data.currency)}</StatNumber>
                            {/* <StatHelpText>
                                <StatArrow type="increase" />
                                5% vs last period (Example)
                            </StatHelpText> */}
                        </Stat>
                        <Stat p={5} shadow="md" border="1px" borderColor="gray.200" borderRadius="md">
                            <StatLabel>Total Orders</StatLabel>
                            <StatNumber>{data.totalOrders?.toLocaleString()}</StatNumber>
                            {/* <StatHelpText>
                                <StatArrow type="decrease" />
                                2% vs last period (Example)
                            </StatHelpText> */}
                        </Stat>
                        <Stat p={5} shadow="md" border="1px" borderColor="gray.200" borderRadius="md">
                            <StatLabel>Average Order Value (AOV)</StatLabel>
                            <StatNumber>{formatCurrency(data.averageOrderValue, data.currency)}</StatNumber>
                            {/* <StatHelpText>Vs previous period</StatHelpText> */}
                        </Stat>
                         <Stat p={5} shadow="md" border="1px" borderColor="gray.200" borderRadius="md">
                            <StatLabel>Types of Items Sold</StatLabel>
                            <StatNumber>{data.totalItemsSold?.toLocaleString()}</StatNumber>
                            {/* <StatHelpText>Vs previous period</StatHelpText> */}
                        </Stat>
                    </SimpleGrid>

                    {/* Trend Charts Section - Use LineChart component */}
                     {/* <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                        <Box p={5} shadow="md" border="1px" borderColor="gray.200" borderRadius="md" minHeight="300px">
                            <Heading size="md" mb={4}>Sales Trend</Heading>
                            <LineChart
                                data={processedSalesData}
                                xAccessor={d => d.day} // Access the 'day' (Date object)
                                yAccessor={d => d.sales} // Access the 'sales' number
                                xScaleType="time"
                                yScaleType="linear"
                                xAxisLabel="Date"
                                yAxisLabel="Revenue (UGX)"
                                lineColor={salesLineColor} // Use theme color
                                // Adjust width/height/margins as needed
                                // width= calculated width or fixed
                                // height={300}
                                yAxisFormat="~s" // Use SI prefixes (k, M) for revenue
                            />
                        </Box>
                         <Box p={5} shadow="md" border="1px" borderColor="gray.200" borderRadius="md" minHeight="300px">
                            <Heading size="md" mb={4}>Orders Trend</Heading>
                            <LineChart
                                data={processedOrdersData}
                                xAccessor={d => d.day} // Access the 'day' (Date object)
                                yAccessor={d => d.orders} // Access the 'orders' number
                                xScaleType="time"
                                yScaleType="linear"
                                xAxisLabel="Date"
                                yAxisLabel="Number of Orders"
                                lineColor={ordersLineColor} // Use theme color
                                // width=calculated width or fixed 
                                // height={300}
                                yAxisFormat="d" // Integer format for orders count
                            />
                        </Box>
                    </SimpleGrid> */}
                </>
            )}
        </Box>
    );
};

export default DashboardOverview;
