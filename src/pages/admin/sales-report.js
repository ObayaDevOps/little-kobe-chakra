import React, { useState, useEffect } from 'react';
import Head from 'next/head';
// Assuming you have some admin layout/wrapper
// import AdminLayout from '@/components/AdminLayout';

// No interface needed in JS

const SalesReportPage = () => { // Removed React.FC type
    const [reportData, setReportData] = useState([]); // Removed type parameter
    const [isLoading, setIsLoading] = useState(true); // Removed type parameter
    const [error, setError] = useState(null); // Removed type parameter

    useEffect(() => {
        const fetchReportData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch('/api/admin/sales-report');
                if (!response.ok) {
                    // Basic error handling, consider more robust error type checking
                    let errorMsg = `HTTP error! status: ${response.status}`;
                    try {
                        const errorBody = await response.json();
                        errorMsg = errorBody.message || errorMsg;
                    } catch (parseError) {
                        // Ignore if response body is not JSON or empty
                    }
                    throw new Error(errorMsg);
                }
                const data = await response.json(); // Removed type assertion
                setReportData(data);
            } catch (err) {
                console.error("Failed to fetch sales report:", err);
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        fetchReportData();
    }, []); // Empty dependency array means this runs once on mount

    return (
        // <AdminLayout> {/* Wrap with your admin layout if you have one */}
        <>
            <Head>
                <title>Admin - Sales Report</title>
            </Head>
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-4">Sales Report</h1>

                {isLoading && <p>Loading sales data...</p>}
                {error && <p className="text-red-500">Error loading data: {error}</p>}

                {!isLoading && !error && (
                    <>
                        {reportData.length === 0 ? (
                            <p>No sales data available.</p>
                        ) : (
                            <ul>
                                {/* Ensure item has productId, label, and value */}
                                {reportData.map((item) => (
                                    <li key={item.productId} className="border-b py-2">
                                        <strong>{item.label || 'N/A'}:</strong> {item.value ?? 'N/A'} sold
                                    </li>
                                ))}
                            </ul>
                        )}
                        {/* TODO: Add charts or more detailed tables */}
                    </>
                )}
            </div>
        </>
      // </AdminLayout>
    );
};

export default SalesReportPage;

// Optional: Add authentication/authorization check if needed
// export async function getServerSideProps(context) {
//   // ... check if user is admin
//   return { props: {} };
// } 