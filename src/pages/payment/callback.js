// pages/payment/callback.js
'use client'; // Mark as Client Component

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import {
    Container,
    Box,
    Heading,
    Text,
    Center, // For centering content
    Spinner, // Loading indicator
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    VStack, // Vertical stack for layout
    Link as ChakraLink, // To distinguish from NextLink if needed
    Button, // Optional button for manual navigation
    useToast
} from '@chakra-ui/react';
import NextLink from 'next/link'; // For client-side navigation links
import { useCartStore } from '../../lib/cartStore'



const SHOPKEEPER_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_SHOPKEEPER_WA_NUMBER;

// Define possible states for the verification process
const VerificationState = {
    IDLE: 'idle', // Initial state before checks
    MISSING_PARAMS: 'missing_params', // URL params are invalid
    VERIFYING: 'verifying', // Backend verification in progress
    VERIFIED: 'verified', // Backend verification complete
    ERROR: 'error', // An error occurred during verification
};

function PaymentCallbackPage() {
    const router = useRouter();
    const toast = useToast();

    const { items, clearCart } = useCartStore()


    // State Management
    const [processStatus, setProcessStatus] = useState(VerificationState.IDLE);
    const [error, setError] = useState(null); // Stores specific error message
    // Stores the *full* response from verify endpoint, including nested orderDetails
    const [verifiedData, setVerifiedData] = useState(null);

    // Extract query parameters safely only when router is ready
    const { OrderTrackingId, OrderMerchantReference } = router.query;

    // --- Function to send order confirmation email to shop keeper ---
    const sendOrderConfirmationEmailShopkeeper = useCallback(async (orderDetails) => {
        console.log('Email Order Details:', orderDetails);
        
        // Check if essential parts of orderDetails exist
        if (!orderDetails || !orderDetails.items || !orderDetails.delivery_address || !orderDetails.totalAmount) {
            console.error("Cannot send confirmation email: Missing or incomplete order details (expecting delivery_address).", orderDetails);
            toast({
                title: 'Email Notification Issue',
                description: 'Could not assemble order confirmation email (details missing). Support notified.',
                status: 'warning',
                duration: 5000,
                isClosable: true,
                position: 'top',
            });
            // Potentially log this error more formally
            return; // Don't proceed
        }

        try {
            console.log("Sending order confirmation email with details to shopkeeper:", orderDetails);
            // Call the new API endpoint created in Step 7
            await axios.post('/api/notify-shopkeeper-order-confirmation', { orderDetails }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 15000, // Timeout for the email sending API
            });
            console.log("Order confirmation email request sent successfully.");
            // Optional: Success toast (might be too much)
            // toast({ title: 'Order Notification Sent', status: 'success', duration: 2000 });
        } catch (emailError) {
            console.error("Failed to send order confirmation email to shopkeeper via API:", emailError.response?.data || emailError.message);
            toast({
                title: 'Email Notification Failed',
                description: 'The order confirmation email could not be sent automatically. Please contact support if you need confirmation.',
                status: 'warning', // Use warning, as payment itself was likely successful
                duration: 6000,
                isClosable: true,
                position: 'top',
            });
            // Log this error for investigation. Do NOT block the user flow.
        }
    }, [toast]); // Dependency

    // --- Function to send order confirmation email to customer ---
    const sendOrderConfirmationEmailCustomer = useCallback(async (orderDetails) => {
        console.log('Email Order Details:', orderDetails);
        
        // Check if essential parts of orderDetails exist
        if (!orderDetails || !orderDetails.items || !orderDetails.delivery_address || !orderDetails.totalAmount) {
            console.error("Cannot send confirmation email: Missing or incomplete order details (expecting delivery_address).", orderDetails);
            toast({
                title: 'Email Notification Issue',
                description: 'Could not assemble order confirmation email (details missing). Support notified.',
                status: 'warning',
                duration: 5000,
                isClosable: true,
                position: 'top',
            });
            // Potentially log this error more formally
            return; // Don't proceed
        }

        try {
            console.log("Sending order confirmation email with details to customer:", orderDetails);
            // Call the new API endpoint created in Step 7
            await axios.post('/api/notify-customer-order-confirmation', { orderDetails }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 15000, // Timeout for the email sending API
            });
            console.log("Order confirmation email request sent successfully.");
            // Optional: Success toast (might be too much)
            // toast({ title: 'Order Notification Sent', status: 'success', duration: 2000 });
        } catch (emailError) {
            console.error("Failed to send order confirmation email to customer via API:", emailError.response?.data || emailError.message);
            toast({
                title: 'Email Notification Failed',
                description: 'The order confirmation email could not be sent automatically. Please contact support if you need confirmation.',
                status: 'warning', // Use warning, as payment itself was likely successful
                duration: 6000,
                isClosable: true,
                position: 'top',
            });
            // Log this error for investigation. Do NOT block the user flow.
        }
    }, [toast]); // Dependency

    // --- Function to send order confirmation WhatsApp to shop keeper ---
    const sendOrderConfirmationWhatsAppShopkeeper = useCallback(async (orderDetails) => {
        console.log('WhatsApp Order Details:', orderDetails);
        
        // Check if essential parts of orderDetails exist
        if (!orderDetails || !orderDetails.items || !orderDetails.delivery_address || !orderDetails.totalAmount) {
            console.error("Cannot send confirmation WhatsApp: Missing or incomplete order details (expecting delivery_address).", orderDetails);
            toast({
                title: 'WhatsApp Notification Issue',
                description: 'Could not assemble order confirmation WhatsApp (details missing). Support notified.',
                status: 'warning',
                duration: 5000,
                isClosable: true,
                position: 'top',
            });
            // Potentially log this error more formally
            return; // Don't proceed
        }

        try {
            console.log("Sending order confirmation WhatsApp with details to shopkeeper:", orderDetails);
            // Call the new API endpoint created in Step 7
            const shopkeeperPhone = SHOPKEEPER_WHATSAPP_NUMBER?.toString().trim();

            if (!shopkeeperPhone) {
                console.error('NEXT_PUBLIC_SHOPKEEPER_WA_NUMBER env variable is not set, skipping shopkeeper WhatsApp notification.');
                toast({
                    title: 'WhatsApp Notification Unavailable',
                    description: 'Shopkeeper WhatsApp number is not configured yet. Please let support know.',
                    status: 'warning',
                    duration: 6000,
                    isClosable: true,
                    position: 'top',
                });
                return;
            }

            await axios.post('/api/whatsapp/send-order-confirmation', { recipientPhoneNumber: shopkeeperPhone, orderDetails, isShopkeeper: true }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 15000, // Timeout for the WhatsApp sending API
            });
            console.log("Order confirmation WhatsApp request sent successfully.");
            // Optional: Success toast (might be too much)
            // toast({ title: 'Order Notification Sent', status: 'success', duration: 2000 });
        } catch (whatsappError) {
            console.error("Failed to send order confirmation WhatsApp to shopkeeper via API:", whatsappError.response?.data || whatsappError.message);
            toast({
                title: 'WhatsApp Notification Failed',
                description: 'The order confirmation WhatsApp could not be sent automatically. Please contact support if you need confirmation.',
                status: 'warning', // Use warning, as payment itself was likely successful
                duration: 6000,
                isClosable: true,
                position: 'top',
            });
            // Log this error for investigation. Do NOT block the user flow.
        }
    }, [toast]); // Dependency

    // --- Function to send order confirmation WhatsApp to customer ---
    const sendOrderConfirmationWhatsAppCustomer = useCallback(async (orderDetails) => {
        console.log('WhatsApp Order Details:', orderDetails);
        
        // Check if essential parts of orderDetails exist
        if (!orderDetails || !orderDetails.items || !orderDetails.delivery_address || !orderDetails.totalAmount) {
            console.error("Cannot send confirmation WhatsApp: Missing or incomplete order details (expecting delivery_address).", orderDetails);
            toast({
                title: 'WhatsApp Notification Issue',
                description: 'Could not assemble order confirmation WhatsApp (details missing). Support notified.',
                status: 'warning',
                duration: 5000,
                isClosable: true,
                position: 'top',
            });
            // Potentially log this error more formally
            return; // Don't proceed
        }

        try {
            console.log("Sending order confirmation WhatsApp with details to customer:", orderDetails);
            // Call the new API endpoint created in Step 7
            const customerPhone = orderDetails.customerPhoneNumber?.toString().trim();

            if (!customerPhone) {
                console.warn('Customer WhatsApp number missing, skipping customer notification.');
                toast({
                    title: 'WhatsApp Notification Unavailable',
                    description: 'Customer WhatsApp number was not provided at checkout.',
                    status: 'warning',
                    duration: 6000,
                    isClosable: true,
                    position: 'top',
                });
                return;
            }

            await axios.post('/api/whatsapp/send-order-confirmation', { recipientPhoneNumber: customerPhone, orderDetails, isShopkeeper: false }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 15000, // Timeout for the WhatsApp sending API
            });
            console.log("Order confirmation WhatsApp request sent successfully.");
            // Optional: Success toast (might be too much)
            // toast({ title: 'Order Notification Sent', status: 'success', duration: 2000 });
        } catch (whatsappError) {
            console.error("Failed to send order confirmation WhatsApp to customer via API:", whatsappError.response?.data || whatsappError.message);
            toast({
                title: 'WhatsApp Notification Failed',
                description: 'The order confirmation WhatsApp could not be sent automatically. Please contact support if you need confirmation.',
                status: 'warning', // Use warning, as payment itself was likely successful
                duration: 6000,
                isClosable: true,
                position: 'top',
            });
            // Log this error for investigation. Do NOT block the user flow.
        }
    }, [toast]); // Dependency

    // --- Verification Logic ---
    const verifyPayment = useCallback(async (trackingId) => {
        if (!trackingId) {
            console.error("verifyPayment called without trackingId");
            setProcessStatus(VerificationState.MISSING_PARAMS);
            setError("Invalid callback: Tracking ID missing.");
            return;
        }

        setProcessStatus(VerificationState.VERIFYING);
        setError(null);
        setVerifiedData(null);

        console.log(`Verifying payment for OrderTrackingId: ${trackingId}`);

        try {
            // Call the updated verify API (Step 5)
            const response = await axios.post('/api/payments/verify', { orderTrackingId: trackingId }, {
                 headers: { 'Content-Type': 'application/json' },
                 timeout: 30000, // Increased timeout for verification + DB lookup
            });

            console.log("Verification API response:", response.data);

            // Check for the structure returned by the updated verify API
            if (response.data && response.data.status && response.data.orderDetails) {
                setVerifiedData(response.data); // Store the entire response
                setProcessStatus(VerificationState.VERIFIED);

                // Convert received status to uppercase for case-insensitive comparison
                const isSuccess = response.data.status?.toUpperCase() === 'COMPLETED';

                const toastStatus = isSuccess ? 'success' : (response.data.status === 'FAILED' ? 'error' : 'warning');
                toast({
                    title: `Payment Status: ${response.data.status}`, // Show actual status from API
                    description: response.data.statusDescription || 'Verification complete.',
                    status: toastStatus,
                    duration: 5000,
                    isClosable: true,
                    position: 'top',
                 });

                // --- Order Confirmation Email & Cart Clearing ---
                if (isSuccess) {
                    console.log("Payment completed successfully. Processing post-payment actions.");

                    // Extract orderDetails from the response
                    const orderDetailsForComms = { ...response.data.orderDetails };

                    const deliveryAddressForComms = orderDetailsForComms?.delivery_address || {};
                    if (!orderDetailsForComms.customerName) {
                        orderDetailsForComms.customerName =
                            deliveryAddressForComms.first_name ||
                            deliveryAddressForComms.name ||
                            'Customer';
                    }
                    const locationLine =
                        deliveryAddressForComms.line_1 ||
                        deliveryAddressForComms.address ||
                        deliveryAddressForComms.city ||
                        '';
                    const lat = typeof deliveryAddressForComms.latitude === 'number' ? deliveryAddressForComms.latitude : null;
                    const lng = typeof deliveryAddressForComms.longitude === 'number' ? deliveryAddressForComms.longitude : null;
                    if (
                        (!orderDetailsForComms.deliveryLocation ||
                            typeof orderDetailsForComms.deliveryLocation.latitude !== 'number' ||
                            typeof orderDetailsForComms.deliveryLocation.longitude !== 'number') &&
                        typeof lat === 'number' &&
                        typeof lng === 'number'
                    ) {
                        orderDetailsForComms.deliveryLocation = { latitude: lat, longitude: lng };
                    }
                    if (!orderDetailsForComms.deliveryLocationText) {
                        orderDetailsForComms.deliveryLocationText = locationLine.toString().trim();
                    }
                    orderDetailsForComms.estimatedDelivery =
                        'Please allow 1 hour post-payment to prepare your order, and transport time, we will notify you when order is sent';

                    if (!orderDetailsForComms.customerPhoneNumber) {
                        const fallbackPhone = orderDetailsForComms.customer_phone || orderDetailsForComms.customer_phone_number;
                        if (fallbackPhone) {
                            orderDetailsForComms.customerPhoneNumber = fallbackPhone.toString().trim();
                        }
                    }

                    // Add confirmation code if available (might already be in orderDetails depending on verify API)
                    if (response.data.confirmationCode && !orderDetailsForComms.confirmationCode) {
                        orderDetailsForComms.confirmationCode = response.data.confirmationCode;
                    }
                     // Ensure merchant ref is consistent (URL query param might be more reliable if different)
                     orderDetailsForComms.merchantReference = OrderMerchantReference || orderDetailsForComms.merchantReference;


                    // 1. Send Emails to Shopkeeper and Customer (async, non-blocking for user flow)
                    sendOrderConfirmationEmailShopkeeper(orderDetailsForComms);
                    sendOrderConfirmationEmailCustomer(orderDetailsForComms);

                    //Send WhatsApp to Customer and Shopkeeper here
                    sendOrderConfirmationWhatsAppShopkeeper(orderDetailsForComms);
                    sendOrderConfirmationWhatsAppCustomer(orderDetailsForComms);


                    // 2. Clear the Cart
                    console.log('Clearing cart...');
                    clearCart();
                    console.log('CART CLEARED');
                } else {
                    console.log(`Payment status is ${response.data.status}. Not sending confirmation email or clearing cart.`);
                }

                // --- Redirect Logic ---
                // Use OrderMerchantReference from URL query for consistency in redirect URL
                const redirectRef = OrderMerchantReference || response.data.orderDetails.merchantReference || '';
                const redirectPath = isSuccess
                    ? `/payment/success?ref=${redirectRef}`
                    : `/payment/failure?ref=${redirectRef}&status=${response.data.status}`;

                setTimeout(() => {
                     console.log(`Redirecting to: ${redirectPath}`);
                     router.push(redirectPath);
                 }, 3000); // 3 second delay

            } else {
                // Backend responded but with unexpected data structure
                console.error("Verification API returned unexpected data structure or missing orderDetails:", response.data);
                setError('Verification response from server was incomplete or invalid.');
                setProcessStatus(VerificationState.ERROR);
            }

        } catch (err) {
            console.error("Error calling verification API:", err.response?.data || err.message);
            let errorMessage = 'An unexpected error occurred while verifying your payment.';
             if (axios.isAxiosError(err)) {
                if (err.response) {
                    // Use message from backend if available
                     errorMessage = err.response.data?.message || `Verification failed (${err.response.status}). Please contact support if the problem persists.`;
                 } else if (err.request) {
                     errorMessage = 'Could not connect to verification server. Please check your connection or try again later.';
                 } else {
                     errorMessage = `Verification request setup failed: ${err.message}`;
                 }
             } else {
                 errorMessage = err.message || errorMessage;
            }
            setError(errorMessage);
            setProcessStatus(VerificationState.ERROR);
        }
    }, [
        router,
        OrderMerchantReference,
        toast,
        clearCart,
        sendOrderConfirmationEmailShopkeeper,
        sendOrderConfirmationEmailCustomer,
        sendOrderConfirmationWhatsAppShopkeeper,
        sendOrderConfirmationWhatsAppCustomer,
    ]); // Added dependencies

    // --- Effect Hook ---
    useEffect(() => {
        if (router.isReady && processStatus === VerificationState.IDLE) {
            console.log("Router ready, processing callback...");
            console.log("Query Params:", router.query);

            if (OrderTrackingId) {
                verifyPayment(OrderTrackingId);
            } else {
                 console.warn("Callback page loaded without OrderTrackingId.");
                 setError("Invalid payment callback URL. Tracking information is missing.");
                 setProcessStatus(VerificationState.MISSING_PARAMS);
            }
        }
    }, [router.isReady, router.query, OrderTrackingId, processStatus, verifyPayment]); // verifyPayment dependency is correct


    // --- Render Logic ---

    // Helper function to render content based on state
    const renderContent = () => {
        switch (processStatus) {
            case VerificationState.VERIFYING:
            case VerificationState.IDLE:
                return (
                    <Center flexDirection="column">
                        <Spinner
                            thickness="4px"
                            speed="0.65s"
                            emptyColor="gray.200"
                            color="blue.500"
                            size="xl"
                            label="Verifying payment..." // Accessibility label
                        />
                        <Text mt={4} fontSize="lg" fontWeight="medium" fontFamily='nbText'>Verifying Payment...</Text>
                        <Text mt={1} fontSize="sm" color="gray.500" fontFamily='nbText'>Please wait, this may take a moment.</Text>
                    </Center>
                );

            case VerificationState.VERIFIED:
                if (!verifiedData) return null;

                const isSuccess = verifiedData.status === 'COMPLETED';
                const alertStatus = isSuccess ? 'success' : (verifiedData.status === 'FAILED' ? 'error' : 'warning');
                const alertTitle = isSuccess ? 'Payment Verified Successfully!' : `Payment Status: ${verifiedData.status}`;
                // Use OrderMerchantReference from URL query param for display consistency
                const displayRef = OrderMerchantReference || verifiedData.orderDetails?.merchantReference;

                return (
                    <Alert
                        status={alertStatus}
                        variant="subtle"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        textAlign="center"
                        py={6} // Padding top/bottom
                        borderRadius="md"
                    >
                        <AlertIcon boxSize="40px" mr={0} />
                        <AlertTitle mt={4} mb={1} fontSize="xl" fontFamily='nbText'>
                            {alertTitle}
                        </AlertTitle>
                        <AlertDescription maxWidth="sm">
                            <Text mb={2} fontFamily='nbText' >{verifiedData.statusDescription || (isSuccess ? 'Your payment has been confirmed.' : 'There was an issue processing the payment status.')}</Text>
                            {displayRef && (
                                <Text fontSize="sm" color="gray.600" fontFamily='nbText'>Order Reference: {displayRef}</Text>
                            )}
                             {verifiedData.confirmationCode && isSuccess && (
                                <Text fontSize="sm" color="gray.600" fontFamily='nbText'>Confirmation Code: {verifiedData.confirmationCode}</Text>
                            )}
                            <Text mt={4} fontSize="sm" fontWeight="medium" fontFamily='nbText'>
                                You will be redirected shortly...
                            </Text>
                        </AlertDescription>
                    </Alert>
                );

            case VerificationState.ERROR:
                 return (
                    <Alert status="error" borderRadius="md">
                        <AlertIcon />
                         <Box flex="1">
                            <AlertTitle fontFamily='nbText'>Verification Error!</AlertTitle>
                            <AlertDescription display="block" fontFamily='nbText'>
                                {error || 'An unknown error occurred during payment verification.'}
                                <Text mt={2}>Please contact support if you believe payment was successful or if this issue persists.</Text>
                            </AlertDescription>
                         </Box>
                    </Alert>
                 );

             case VerificationState.MISSING_PARAMS:
                 return (
                    <Alert status="error" borderRadius="md">
                        <AlertIcon />
                        <Box flex="1">
                            <AlertTitle fontFamily='nbText'>Invalid Callback</AlertTitle>
                            <AlertDescription display="block" fontFamily='nbText'>
                                {error || 'Could not verify payment because required tracking information was missing from the URL.'}
                            </AlertDescription>
                        </Box>
                    </Alert>
                 );

            default:
                return null; // Should not be reached
        }
    };

    return (
        <Container maxW="container.md" py={10} minHeight="60vh"> {/* Ensure some minimum height */}
            <Center h="100%">
                <VStack spacing={6} align="stretch" w="100%">
                    <Heading as="h1" size="lg" textAlign="center" fontFamily='nbText'>
                        Payment Processing
                    </Heading>
                    <Box p={5} borderWidth={processStatus !== VerificationState.VERIFYING && processStatus !== VerificationState.IDLE ? "1px" : "0px"} borderRadius="lg" shadow="sm">
                        {renderContent()}
                    </Box>
                     {/* Optional: Add a button to manually go back or to the relevant success/fail page */}
                     {(processStatus === VerificationState.ERROR || processStatus === VerificationState.MISSING_PARAMS) && (
                        <Center>
                            <NextLink href="/" passHref legacyBehavior>
                                 <Button as="a" colorScheme="gray" mt={4} fontFamily='nbText'>
                                     Go to Homepage
                                 </Button>
                            </NextLink>
                        </Center>
                     )}
                </VStack>
            </Center>
        </Container>
    );
}

export default PaymentCallbackPage;
