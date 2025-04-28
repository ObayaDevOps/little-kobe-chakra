// pages/checkout.js
'use client'; // Mark as a Client Component

import { useState, useEffect } from 'react';
import axios from 'axios'; // Using axios for API calls
import {
    Container,
    Box,
    Heading,
    Text,
    Button,
    VStack, // Vertical Stack for layout
    HStack, // Horizontal Stack (can be useful, using Flex here)
    Flex,   // Flexible box layout
    Spacer, // Pushes elements apart in Flex
    Divider,// Horizontal rule
    Alert,  // For displaying errors nicely
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Center, // Utility for centering
    useToast // Optional: For showing temporary notifications
} from '@chakra-ui/react';

// Example Data (same as before)
const exampleCartItems = [
    { id: 'prod_1', name: 'Awesome T-Shirt', price: 25.50, quantity: 1 },
    { id: 'prod_2', name: 'Cool Hat', price: 15.00, quantity: 2 },
];

const exampleUser = {
    email: 'customer@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    phone: '254712345678',
    address: {
        line1: '123 Main St',
        city: 'Nairobi',
        countryCode: 'KE',
    }
};

function CheckoutPageAI() {
    // --- State Variables ---
    const [cartItems, setCartItems] = useState(exampleCartItems);
    const [user, setUser] = useState(exampleUser);
    const [orderTotal, setOrderTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currency] = useState('KES');
    const toast = useToast(); // Optional: Initialize toast

    // --- Effects ---
    useEffect(() => {
        const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        setOrderTotal(total);
    }, [cartItems]);

    // --- Event Handlers ---
    const handlePayment = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        if (orderTotal <= 0) {
            setError('Cannot process payment for an empty cart or zero total.');
            setLoading(false);
            return;
        }

        const description = `Payment for ${cartItems.length} item(s). Order Ref: ${Date.now()}`;
        const billing_address = {
            email_address: user.email || '',
            phone_number: user.phone || '',
            country_code: user.address?.countryCode || '',
            first_name: user.firstName || '',
            last_name: user.lastName || '',
            line_1: user.address?.line1 || '',
            city: user.address?.city || '',
        };

        if (!billing_address.email_address && !billing_address.phone_number) {
             setError('Customer email address or phone number is required to proceed.');
             setLoading(false);
             return;
        }

        const orderDetails = {
            amount: orderTotal,
            currency: currency,
            description: description,
            billing_address: billing_address,
        };

        console.log("Sending order details to backend:", orderDetails);

        try {
            const response = await axios.post('/api/payments/initiate', orderDetails, {
                 headers: { 'Content-Type': 'application/json' },
                 timeout: 20000,
            });

            console.log("Backend response:", response.data);

            if (response.data && response.data.redirectUrl) {
                console.log("Redirecting to Pesapal:", response.data.redirectUrl);
                 // Optional: Show a success toast before redirecting
                 toast({
                    title: 'Redirecting to Pesapal...',
                    description: "You will be redirected to complete your payment securely.",
                    status: 'info',
                    duration: 3000,
                    isClosable: true,
                 });
                // Add a small delay so the user sees the toast
                setTimeout(() => {
                    window.location.href = response.data.redirectUrl;
                }, 1500);
            } else {
                console.error("Backend did not return a redirect URL:", response.data);
                setError(response.data?.message || 'Failed to get payment URL from server. Please try again.');
                setLoading(false);
            }
        } catch (err) {
            console.error("Error initiating payment:", err);
            let errorMessage = 'An unexpected error occurred while initiating payment.';
             if (axios.isAxiosError(err)) {
                if (err.response) {
                     console.error("Backend Error Response Data:", err.response.data);
                     console.error("Backend Error Response Status:", err.response.status);
                    errorMessage = err.response.data?.message || `Server error (${err.response.status}). Please try again later.`;
                } else if (err.request) {
                    console.error("No response received:", err.request);
                    errorMessage = 'Could not connect to the payment server. Please check your internet connection and try again.';
                } else {
                     console.error('Axios Error', err.message);
                    errorMessage = `Payment initiation failed: ${err.message}`;
                }
            } else {
                 console.error('Non-Axios Error', err);
                 errorMessage = err.message || errorMessage;
            }
            setError(errorMessage);
            setLoading(false);
        }
    };

    // --- Render Logic ---
    return (
        <Container maxW="container.md" py={10}> {/* Responsive max width, padding top/bottom */}
            <VStack spacing={6} align="stretch"> {/* Vertical stack with spacing */}
                <Heading as="h1" size="xl" textAlign="center">
                    Checkout
                </Heading>

                {/* Order Summary Section */}
                <Box borderWidth="1px" borderRadius="lg" p={5} shadow="sm" bg="gray.50">
                    <Heading as="h2" size="md" mb={4}>
                        Order Summary
                    </Heading>
                    <VStack spacing={3} align="stretch">
                        {cartItems.map(item => (
                            <Flex key={item.id} fontSize="sm">
                                <Text>
                                    {item.name} (x{item.quantity})
                                </Text>
                                <Spacer /> {/* Pushes price to the right */}
                                <Text fontWeight="medium">
                                    {currency} {(item.price * item.quantity).toFixed(2)}
                                </Text>
                            </Flex>
                        ))}
                        <Divider my={2} /> {/* Margin top/bottom */}
                        <Flex fontWeight="bold" fontSize="lg">
                            <Text>Total:</Text>
                            <Spacer />
                            <Text>{currency} {orderTotal.toFixed(2)}</Text>
                        </Flex>
                    </VStack>
                </Box>

                {/* Billing Details Section */}
                 <Box borderWidth="1px" borderRadius="lg" p={5} shadow="sm">
                     <Heading as="h2" size="md" mb={4}>
                        Billing Details
                    </Heading>
                     <VStack spacing={2} align="stretch" fontSize="sm">
                         <Text><strong>Name:</strong> {user.firstName} {user.lastName}</Text>
                         <Text><strong>Email:</strong> {user.email}</Text>
                         <Text><strong>Phone:</strong> {user.phone || 'N/A'}</Text>
                         {/* Add more address details if desired */}
                          <Text><strong>Address:</strong> {user.address?.line1 || ''}, {user.address?.city || ''} ({user.address?.countryCode || ''})</Text>
                     </VStack>
                 </Box>


                {/* Error Display Area */}
                {error && (
                    <Alert status="error" borderRadius="md">
                        <AlertIcon />
                        <Box>
                            <AlertTitle>Payment Error!</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Box>
                    </Alert>
                )}

                {/* Payment Button */}
                <Center> {/* Centers the button */}
                    <Button
                        colorScheme="blue" // Chakra color scheme
                        size="lg"          // Button size
                        onClick={handlePayment}
                        isLoading={loading} // Handles loading state automatically
                        loadingText="Processing..." // Text shown when loading
                        isDisabled={loading || orderTotal <= 0} // Disables button correctly
                        mt={4} // Margin top
                    >
                        Pay {currency} {orderTotal.toFixed(2)} with Pesapal
                    </Button>
                </Center>
            </VStack>
        </Container>
    );
}

export default CheckoutPageAI;