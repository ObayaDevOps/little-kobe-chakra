import React from 'react';
import Head from 'next/head';
import { Box, Divider } from '@chakra-ui/react';
// Assuming you have some admin layout/wrapper
// import AdminLayout from '@/components/AdminLayout';

// --- Import the new Dashboard Overview component ---
import DashboardOverview from '@/components/Analytics/DashboardOverview'; // Adjust path if needed
// --- Import the new Recent Orders component ---
import RecentOrdersList from '@/components/Analytics/RecentOrdersList'; // Adjust path if needed
import AdminNavbar from '@/components/admin/AdminNavbar';

const OrdersAndSalesPage = () => {
    return (
        // <AdminLayout> {/* Wrap with your admin layout if you have one */}
        <>
            <Head>
                {/* Updated title to reflect the overview nature */}
                <title>Admin - Sales Overview</title>
            </Head>
            <AdminNavbar />
            {/* Keep outer padding Box */}
            <Box p={8} maxW="container.xl" mx="auto">
                {/* Heading remains similar, but the content below changes */}
                {/* <Heading as="h1" size="lg" mb={6}>
                    Sales Report
                </Heading> */}

                {/* --- Render the Dashboard Overview component --- */}
                {/* It handles its own heading, loading, error states, and data display */}
                <DashboardOverview />

                {/* --- Add a divider --- */}
                <Divider my={10} /> {/* Add some vertical space and visual separation */}

                {/* --- Render the Recent Orders List --- */}
                <RecentOrdersList />

            </Box>
        </>
      // </AdminLayout>
    );
};

export default OrdersAndSalesPage;

// Optional: Add authentication/authorization check if needed
// export async function getServerSideProps(context) {
//   // ... check if user is admin
//   return { props: {} };
// } 
