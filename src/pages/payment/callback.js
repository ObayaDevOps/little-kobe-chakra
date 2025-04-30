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
    const [verifiedData, setVerifiedData] = useState(null); // Stores data from backend verify endpoint { status: 'COMPLETED' | 'FAILED' | 'PENDING', statusDescription: '...', confirmationCode: '...' }

    // Extract query parameters safely only when router is ready
    const { OrderTrackingId, OrderMerchantReference } = router.query;

    // --- Verification Logic ---
    const verifyPayment = useCallback(async (trackingId) => {
        if (!trackingId) {
            console.error("verifyPayment called without trackingId");
            setProcessStatus(VerificationState.MISSING_PARAMS);
            return;
        }

        setProcessStatus(VerificationState.VERIFYING);
        setError(null); // Clear previous errors
        setVerifiedData(null);

        console.log(`Verifying payment for OrderTrackingId: ${trackingId}`);

        try {
            const response = await axios.post('/api/payments/verify', { orderTrackingId: trackingId }, {
                 headers: { 'Content-Type': 'application/json' },
                 timeout: 25000, // Allow more time for status check
            });

            console.log("Verification API response:", response.data);

            if (response.data && response.data.status) {
                setVerifiedData({
                    status: response.data.status, // e.g., 'COMPLETED', 'FAILED', 'PENDING'
                    statusDescription: response.data.statusDescription || '',
                    confirmationCode: response.data.confirmationCode || null,
                });
                setProcessStatus(VerificationState.VERIFIED);

                // Optional: Show toast notification based on status
                 const toastStatus = response.data.status === 'COMPLETED' ? 'success' : (response.data.status === 'FAILED' ? 'error' : 'warning');
                 toast({
                    title: `Payment Status: ${response.data.status}`,
                    description: response.data.statusDescription || 'Verification complete.',
                    status: toastStatus,
                    duration: 5000,
                    isClosable: true,
                    position: 'top',
                 });

                 //OD: Clear the cart here
                 clearCart();
                 console.log('CART CLEARED')


                // Optional: Auto-redirect after a short delay
                const redirectPath = response.data.status === 'COMPLETED'
                    ? `/payment/success?ref=${OrderMerchantReference || ''}`
                    : `/payment/failure?ref=${OrderMerchantReference || ''}&status=${response.data.status}`;

                setTimeout(() => {
                     console.log(`Redirecting to: ${redirectPath}`);
                     router.push(redirectPath);
                 }, 3000); // 3 second delay

            } else {
                // Backend responded but with unexpected data
                console.error("Verification API returned unexpected data structure:", response.data);
                setError('Verification response from server was invalid.');
                setProcessStatus(VerificationState.ERROR);
            }

        } catch (err) {
            console.error("Error calling verification API:", err);
            let errorMessage = 'An unexpected error occurred while verifying your payment.';
             if (axios.isAxiosError(err)) {
                if (err.response) {
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
    }, [router, OrderMerchantReference, toast]); // Include dependencies for useCallback

    // --- Effect Hook ---
    useEffect(() => {
        // Only run when router is ready and we haven't started verifying yet
        if (router.isReady && processStatus === VerificationState.IDLE) {
            console.log("Router ready, processing callback...");
            console.log("Query Params:", router.query);

            if (OrderTrackingId) {
                verifyPayment(OrderTrackingId); // Call the verification function
            } else {
                 console.warn("Callback page loaded without OrderTrackingId.");
                 setError("Invalid payment callback URL. Tracking information is missing.");
                 setProcessStatus(VerificationState.MISSING_PARAMS);
            }
        }
    }, [router.isReady, router.query, OrderTrackingId, processStatus, verifyPayment]); // Add dependencies


    // --- Render Logic ---

    // Helper function to render content based on state
    const renderContent = () => {
        switch (processStatus) {
            case VerificationState.VERIFYING:
            case VerificationState.IDLE: // Show loading also while waiting for router
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
                if (!verifiedData) return null; // Should not happen if state logic is correct

                const isSuccess = verifiedData.status === 'COMPLETED';
                const alertStatus = isSuccess ? 'success' : (verifiedData.status === 'FAILED' ? 'error' : 'warning');
                const alertTitle = isSuccess ? 'Payment Verified Successfully!' : `Payment Status: ${verifiedData.status}`;

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
                            <Text mb={2} fontFamily='nbText' >{verifiedData.statusDescription || (isSuccess ? 'Your payment has been confirmed.' : 'There was an issue with the payment.')}</Text>
                            {OrderMerchantReference && (
                                <Text fontSize="sm" color="gray.600" fontFamily='nbText'>Order Reference: {OrderMerchantReference}</Text>
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
                         <Box>
                            <AlertTitle fontFamily='nbText' >Verification Error!</AlertTitle>
                            <AlertDescription fontFamily='nbText' >
                                {error || 'An unknown error occurred during payment verification.'}
                                <Text mt={2} fontFamily='nbText'>Please contact support if you believe payment was successful or if this issue persists.</Text>
                            </AlertDescription>
                         </Box>
                    </Alert>
                 );

             case VerificationState.MISSING_PARAMS:
                 return (
                    <Alert status="error" borderRadius="md">
                        <AlertIcon />
                        <Box>
                            <AlertTitle fontFamily='nbText' >Invalid Callback</AlertTitle>
                            <AlertDescription fontFamily='nbText' >
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