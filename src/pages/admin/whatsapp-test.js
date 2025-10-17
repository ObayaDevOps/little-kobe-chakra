import { useState } from 'react';
import {
    Box,
    Button,
    Container,
    Divider,
    FormControl,
    FormLabel,
    Heading,
    Input,
    Stack,
    Switch,
    Text,
    useToast,
    Code
} from '@chakra-ui/react';

function WhatsAppTestPage() {
    const toast = useToast();
    const [recipient, setRecipient] = useState('');
    const [isShopkeeper, setIsShopkeeper] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiResponse, setApiResponse] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!recipient.trim()) {
            toast({
                title: 'Recipient required',
                description: 'Enter an E.164 formatted phone number (e.g. +256…)',
                status: 'warning',
                duration: 4000,
                isClosable: true,
                position: 'top'
            });
            return;
        }

        try {
            setIsSubmitting(true);
            setApiResponse(null);

            const params = new URLSearchParams({
                test: 'true',
                testRecipient: recipient.trim(),
                isShopkeeperTest: String(isShopkeeper)
            });

            const response = await fetch(`/api/whatsapp/send-order-confirmation?${params.toString()}`);
            const data = await response.json().catch(() => ({ message: 'No JSON payload returned' }));
            setApiResponse({ status: response.status, data });

            if (response.ok) {
                toast({
                    title: 'Test request sent',
                    description: 'Check the device for the WhatsApp template message.',
                    status: 'success',
                    duration: 5000,
                    isClosable: true,
                    position: 'top'
                });
            } else {
                toast({
                    title: 'WhatsApp API returned an error',
                    description: data?.message || 'See details below.',
                    status: 'error',
                    duration: 6000,
                    isClosable: true,
                    position: 'top'
                });
            }
        } catch (error) {
            console.error('Failed to hit WhatsApp test endpoint:', error);
            setApiResponse({ status: 'network-error', data: { message: error.message } });
            toast({
                title: 'Request failed',
                description: error.message,
                status: 'error',
                duration: 6000,
                isClosable: true,
                position: 'top'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Container maxW="lg" py={12}>
            <Stack spacing={6}>
                <Heading as="h1" size="lg">WhatsApp Template Test</Heading>
                <Text color="gray.600">
                    Use this page to trigger the existing `/api/whatsapp/send-order-confirmation` test mode.
                    Provide a verified WhatsApp number to receive the canned order template.
                </Text>
                <Box as="form" onSubmit={handleSubmit} p={6} borderWidth="1px" borderRadius="lg" boxShadow="sm">
                    <Stack spacing={4}>
                        <FormControl>
                            <FormLabel>Recipient phone number</FormLabel>
                            <Input
                                placeholder="+256700000000"
                                value={recipient}
                                onChange={(event) => setRecipient(event.target.value)}
                                autoComplete="tel"
                            />
                        </FormControl>
                        <FormControl display="flex" alignItems="center">
                            <FormLabel htmlFor="shopkeeper-switch" mb="0">
                                Send shopkeeper variant
                            </FormLabel>
                            <Switch
                                id="shopkeeper-switch"
                                isChecked={isShopkeeper}
                                onChange={(event) => setIsShopkeeper(event.target.checked)}
                            />
                        </FormControl>
                        <Button
                            type="submit"
                            colorScheme="teal"
                            isLoading={isSubmitting}
                            loadingText="Sending"
                        >
                            Send test message
                        </Button>
                    </Stack>
                </Box>

                <Divider />

                <Box>
                    <Heading as="h2" size="md" mb={2}>Latest response</Heading>
                    {apiResponse ? (
                        <Box p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
                            <Text fontWeight="semibold">Status: {apiResponse.status}</Text>
                            <Code display="block" whiteSpace="pre" mt={2} p={2} w="full">
                                {JSON.stringify(apiResponse.data, null, 2)}
                            </Code>
                        </Box>
                    ) : (
                        <Text color="gray.500">Run a test to see Meta API responses and errors here.</Text>
                    )}
                </Box>
            </Stack>
        </Container>
    );
}

export default WhatsAppTestPage;
