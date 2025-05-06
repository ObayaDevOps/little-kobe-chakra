// src/components/Analytics/RecentOrdersList.jsx
import React, { useState } from 'react';
import {
    Box,
    Heading,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableCaption,
    TableContainer,
    Spinner,
    Alert,
    AlertIcon,
    Flex,
    Text,
    Button,
    HStack,
    Badge,
    // --- Modal Imports ---
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    // --- End Modal Imports ---
    VStack, // For layout inside modal
    Divider, // For separation in modal
    Code,    // To display JSON address nicely
} from '@chakra-ui/react';
import useSWR from 'swr';
import { format } from 'date-fns';

// fetcher and formatCurrency remain the same
const fetcher = (url) => fetch(url).then((res) => {
    if (!res.ok) {
        return res.json().then(errorBody => {
            const error = new Error(errorBody.message || `An error occurred while fetching the data (${res.status})`);
            error.status = res.status;
            throw error;
        });
    }
    return res.json();
});
const formatCurrency = (value, currency = 'USD') => {
    const amount = Number(value || 0).toFixed(2);
    return `UGX ${amount}`;
};
// getStatusColorScheme remains the same
const getStatusColorScheme = (status) => {
     switch (status?.toUpperCase()) {
        case 'COMPLETED': case 'DELIVERED': return 'green';
        case 'PENDING': case 'PROCESSING': case 'SHIPPED': return 'blue';
        case 'CANCELLED': case 'FAILED': return 'red';
        case 'REFUNDED': return 'orange';
        default: return 'gray';
    }
};


// --- New component to render Order Details in Modal ---
const OrderDetailsModal = ({ orderId, isOpen, onClose }) => {
    // Fetch data for the specific order ID only when the modal is open and orderId is set
    const apiUrl = orderId ? `/api/orders/${orderId}` : null;
    const { data: orderDetails, error, isLoading } = useSWR(apiUrl, fetcher);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Order Details{orderId ? ` - ${orderId.substring(0, 8)}...` : ''}</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    {isLoading && (
                        <Flex justify="center" align="center" minH="200px"><Spinner /></Flex>
                    )}
                    {error && (
                         <Alert status="error" borderRadius="md">
                            <AlertIcon /> Error loading order details: {error.message}
                         </Alert>
                    )}
                    {orderDetails && !isLoading && !error && (
                        <VStack align="stretch" spacing={4}>
                            <Box>
                                <Heading size="sm" mb={2}>Summary</Heading>
                                <Text><strong>Date:</strong> {format(new Date(orderDetails.created_at), 'yyyy-MM-dd HH:mm:ss')}</Text>
                                <Text><strong>Payment Status:</strong> <Badge colorScheme={getStatusColorScheme(orderDetails.status)} size="sm">{orderDetails.status || 'UNKNOWN'}</Badge></Text>
                                <Text><strong>Total:</strong> {formatCurrency(orderDetails.total_amount, orderDetails.currency)}</Text>
                            </Box>
                            <Divider />
                            <Box>
                                <Heading size="sm" mb={2}>Customer</Heading>
                                <Text><strong>Email:</strong> {orderDetails.customer_email || 'N/A'}</Text>
                                <Text><strong>Phone:</strong> {orderDetails.customer_phone || 'N/A'}</Text>
                                {/* Add Name if available */}
                            </Box>
                            <Divider />
                             <Box>
                                <Heading size="sm" mb={2}>Delivery Address</Heading>
                                {orderDetails.shipping_address ? (
                                     <Code display="block" whiteSpace="pre-wrap" p={3} borderRadius="md" bg="gray.50">
                                        {JSON.stringify(orderDetails.shipping_address, null, 2)}
                                    </Code>
                                ) : (
                                    <Text>N/A</Text>
                                )}
                            </Box>
                            <Divider />
                             <Box>
                                <Heading size="sm" mb={2}>Items ({orderDetails.items.length})</Heading>
                                <TableContainer borderTopWidth="1px" borderColor="gray.100">
                                    <Table variant="simple" size="sm">
                                        <Thead>
                                            <Tr>
                                                <Th>Product</Th>
                                                <Th isNumeric>Qty</Th>
                                                <Th isNumeric>Unit Price</Th>
                                                <Th isNumeric>Total</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {orderDetails.items.map((item, index) => (
                                                <Tr key={`${item.product_id}-${index}`}>
                                                    <Td>{item.product_name || item.product_id}</Td>
                                                    <Td isNumeric>{item.quantity}</Td>
                                                    <Td isNumeric>{formatCurrency(item.unit_price_at_purchase, orderDetails.currency)}</Td>
                                                    <Td isNumeric>{formatCurrency(item.total_item_price, orderDetails.currency)}</Td>
                                                </Tr>
                                            ))}
                                        </Tbody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        </VStack>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button onClick={onClose}>Close</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};


const RecentOrdersList = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const ordersPerPage = 15; // Match API

    // --- Modal State ---
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    // --- End Modal State ---

    const apiUrl = `/api/analytics/recent-orders?page=${currentPage}`;
    // Prefetching list data
    const { data: listData, error: listError, isLoading: listIsLoading } = useSWR(apiUrl, fetcher, { keepPreviousData: true });

    const handlePreviousPage = () => {
        setCurrentPage((prev) => Math.max(1, prev - 1));
    };
    const handleNextPage = () => {
        if (listData?.pagination && currentPage < listData.pagination.totalPages) {
            setCurrentPage((prev) => prev + 1);
        }
    };

    // --- Row Click Handler ---
    const handleRowClick = (orderId) => {
        setSelectedOrderId(orderId);
        onOpen(); // Open the modal
    };
    // --- End Row Click Handler ---

    return (
        <Box mt={10}>
            <Heading size="lg" mb={6}>Recent Orders</Heading>

            {listIsLoading && !listData && (
                <Flex justify="center" align="center" height="150px"><Spinner size="lg" /></Flex>
            )}
            {listError && (
                 <Alert status="error" borderRadius="md">
                    <AlertIcon /> Error fetching recent orders: {listError.message}
                 </Alert>
            )}

            {listData && (
                <>
                    <TableContainer borderWidth="1px" borderColor="gray.200" borderRadius="md">
                        <Table variant='simple'>
                             {/* TableCaption remains the same */}
                             <TableCaption placement="top" mb={2}>
                                Displaying orders {((listData.pagination.currentPage - 1) * ordersPerPage) + 1} - {Math.min(listData.pagination.totalOrders, listData.pagination.currentPage * ordersPerPage)} of {listData.pagination.totalOrders}
                            </TableCaption>
                            <Thead bg="gray.50">
                                <Tr>
                                    <Th>Order ID</Th>
                                    <Th>Date</Th>
                                    <Th>Customer</Th>
                                    <Th isNumeric>Total</Th>
                                    <Th>Payment Status</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {listData.orders.length === 0 && !listIsLoading ? (
                                    <Tr><Td colSpan={5} textAlign="center">No orders found.</Td></Tr>
                                ) : (
                                    listData.orders.map((order) => (
                                        // --- Add onClick and hover styles to Tr ---
                                        <Tr
                                            key={order.id}
                                            onClick={() => handleRowClick(order.id)}
                                            cursor="pointer"
                                            _hover={{ bg: 'gray.50' }}
                                        >
                                            <Td><Text fontSize="xs" color="gray.500">{order.id}</Text></Td>
                                            <Td>{format(new Date(order.created_at), 'yyyy-MM-dd HH:mm')}</Td>
                                            <Td>{order.customer_email || 'N/A'}</Td>
                                            <Td isNumeric>{formatCurrency(order.total_amount, order.currency)}</Td>
                                            <Td><Badge colorScheme={getStatusColorScheme(order.status)} size="sm">{order.status || 'UNKNOWN'}</Badge></Td>
                                        </Tr>
                                        // --- End Tr modification ---
                                    ))
                                )}
                                {listIsLoading && listData && (
                                    <Tr><Td colSpan={5} textAlign="center"><Spinner size="sm" mr={2}/> Loading...</Td></Tr>
                                )}
                            </Tbody>
                        </Table>
                    </TableContainer>

                     {/* Pagination Controls (use listData) */}
                     {listData.pagination && listData.pagination.totalPages > 1 && (
                        <Flex justify="space-between" align="center" mt={4}>
                            <Button onClick={handlePreviousPage} isDisabled={currentPage === 1 || listIsLoading} size="sm">Previous</Button>
                            <Text fontSize="sm">Page {listData.pagination.currentPage} of {listData.pagination.totalPages}</Text>
                            <Button onClick={handleNextPage} isDisabled={currentPage === listData.pagination.totalPages || listIsLoading} size="sm">Next</Button>
                        </Flex>
                    )}
                </>
            )}

            {/* --- Render the Modal --- */}
            {/* Pass selectedOrderId, isOpen, and onClose */}
            <OrderDetailsModal
                orderId={selectedOrderId}
                isOpen={isOpen}
                onClose={() => {
                    onClose();
                    setSelectedOrderId(null); // Clear selected ID when closing
                }}
            />
             {/* --- End Modal Render --- */}

        </Box>
    );
};

export default RecentOrdersList;