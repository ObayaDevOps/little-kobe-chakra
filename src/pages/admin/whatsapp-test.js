import { useEffect, useState } from 'react';
import {
    Badge,
    Box,
    Button,
    Code,
    Container,
    Divider,
    Flex,
    FormControl,
    FormLabel,
    Heading,
    HStack,
    Input,
    Select,
    Spinner,
    Stack,
    Switch,
    Text,
    useToast,
} from '@chakra-ui/react';
import AdminNavbar from '@/components/admin/AdminNavbar';

function WhatsAppTestPage() {
    const toast = useToast();
    const [recipient, setRecipient] = useState('');
    const [isShopkeeper, setIsShopkeeper] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);
    const [isCheckingHealth, setIsCheckingHealth] = useState(false);
    const [apiResponse, setApiResponse] = useState(null);
    const [healthResponse, setHealthResponse] = useState(null);
    const [providerSettings, setProviderSettings] = useState({
        activeProvider: 'meta_api',
        allowFallbackToMeta: true,
    });
    const [providerOverride, setProviderOverride] = useState('auto');
    const [templateSlug, setTemplateSlug] = useState('');
    const [templates, setTemplates] = useState([]);

    const loadProviderSettings = async () => {
        try {
            setIsLoadingSettings(true);
            const [settingsResponse, templatesResponse] = await Promise.all([
                fetch('/api/admin/whatsapp-provider'),
                fetch('/api/admin/whatsapp-templates?includeInactive=false'),
            ]);
            const settingsData = await settingsResponse.json().catch(() => ({}));
            const templatesData = await templatesResponse.json().catch(() => ({}));

            if (!settingsResponse.ok) {
                throw new Error(settingsData?.message || 'Failed to load provider settings');
            }
            setProviderSettings({
                activeProvider: settingsData?.settings?.activeProvider || 'meta_api',
                allowFallbackToMeta: settingsData?.settings?.allowFallbackToMeta !== false,
            });
            setTemplates(Array.isArray(templatesData?.templates) ? templatesData.templates : []);
        } catch (error) {
            toast({
                title: 'Failed to load WhatsApp settings',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
                position: 'top',
            });
        } finally {
            setIsLoadingSettings(false);
        }
    };

    useEffect(() => {
        loadProviderSettings();
    }, []);

    const saveProviderSettings = async () => {
        try {
            setIsSavingSettings(true);
            const response = await fetch('/api/admin/whatsapp-provider', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(providerSettings),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data?.message || 'Failed to save settings');
            }
            setProviderSettings({
                activeProvider: data?.settings?.activeProvider || providerSettings.activeProvider,
                allowFallbackToMeta: data?.settings?.allowFallbackToMeta !== false,
            });
            toast({
                title: 'Provider settings saved',
                status: 'success',
                duration: 4000,
                isClosable: true,
                position: 'top',
            });
        } catch (error) {
            toast({
                title: 'Failed to save settings',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
                position: 'top',
            });
        } finally {
            setIsSavingSettings(false);
        }
    };

    const runHealthCheck = async () => {
        try {
            setIsCheckingHealth(true);
            const params = new URLSearchParams({ provider: providerOverride || 'auto' });
            const response = await fetch(`/api/admin/whatsapp-health?${params.toString()}`);
            const data = await response.json().catch(() => ({ message: 'No JSON payload returned' }));
            setHealthResponse({
                status: response.status,
                ok: response.ok,
                data,
            });
        } catch (error) {
            setHealthResponse({
                status: 'network-error',
                ok: false,
                data: { message: error.message },
            });
        } finally {
            setIsCheckingHealth(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!recipient.trim()) {
            toast({
                title: 'Recipient required',
                description: 'Enter an E.164 formatted phone number (e.g. +256...)',
                status: 'warning',
                duration: 4000,
                isClosable: true,
                position: 'top',
            });
            return;
        }

        try {
            setIsSubmitting(true);
            setApiResponse(null);

            const params = new URLSearchParams({
                test: 'true',
                testRecipient: recipient.trim(),
                isShopkeeperTest: String(isShopkeeper),
                provider: providerOverride,
            });
            if (templateSlug) {
                params.set('templateSlug', templateSlug);
            }

            const response = await fetch(`/api/whatsapp/send-order-confirmation?${params.toString()}`);
            const data = await response.json().catch(() => ({ message: 'No JSON payload returned' }));
            setApiResponse({ status: response.status, data });

            if (response.ok) {
                toast({
                    title: 'Test request sent',
                    description: 'Check the destination device for the WhatsApp message.',
                    status: 'success',
                    duration: 5000,
                    isClosable: true,
                    position: 'top',
                });
            } else {
                toast({
                    title: 'WhatsApp API returned an error',
                    description: data?.message || 'See details below.',
                    status: 'error',
                    duration: 6000,
                    isClosable: true,
                    position: 'top',
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
                position: 'top',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <AdminNavbar />
            <Container maxW="lg" py={12}>
                <Stack spacing={6}>
                    <Heading as="h1" size="lg">WhatsApp Live Test</Heading>
                    <Text color="gray.600">
                        Manage global provider settings, check live WhatsApp readiness, and run a real test send to confirm delivery.
                    </Text>

                    <Box p={6} borderWidth="1px" borderRadius="lg" boxShadow="sm">
                        <Stack spacing={4}>
                            <Flex align="center" justify="space-between">
                                <Heading as="h2" size="md">Global Provider Settings</Heading>
                                {isLoadingSettings && <Spinner size="sm" />}
                            </Flex>
                            <FormControl>
                                <FormLabel>Active provider (global)</FormLabel>
                                <Select
                                    value={providerSettings.activeProvider}
                                    onChange={(event) =>
                                        setProviderSettings((prev) => ({ ...prev, activeProvider: event.target.value }))
                                    }
                                >
                                    <option value="meta_api">Meta API</option>
                                    <option value="baileys_wa">Baileys WA</option>
                                </Select>
                            </FormControl>
                            <FormControl display="flex" alignItems="center">
                                <FormLabel mb="0">Auto-fallback to Meta when Baileys fails</FormLabel>
                                <Switch
                                    isChecked={providerSettings.allowFallbackToMeta}
                                    onChange={(event) =>
                                        setProviderSettings((prev) => ({ ...prev, allowFallbackToMeta: event.target.checked }))
                                    }
                                />
                            </FormControl>
                            <Button
                                onClick={saveProviderSettings}
                                colorScheme="teal"
                                isLoading={isSavingSettings}
                                loadingText="Saving"
                                alignSelf="flex-start"
                            >
                                Save provider settings
                            </Button>
                        </Stack>
                    </Box>

                    <Box p={6} borderWidth="1px" borderRadius="lg" boxShadow="sm">
                        <Stack spacing={4}>
                            <Heading as="h2" size="md">Health & Session Status</Heading>
                            <Text color="gray.600" fontSize="sm">
                                Run a health check before test sends. This includes Meta API status and Baileys auth/session readiness.
                            </Text>
                            <Button
                                onClick={runHealthCheck}
                                isLoading={isCheckingHealth}
                                loadingText="Checking"
                                variant="outline"
                                alignSelf="flex-start"
                            >
                                Run health check
                            </Button>
                            {healthResponse ? (
                                <Box p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
                                    <HStack spacing={3} mb={2}>
                                        <Text fontWeight="semibold">Status: {healthResponse.status}</Text>
                                        <Badge colorScheme={healthResponse.ok ? 'green' : 'red'}>
                                            {healthResponse.ok ? 'Healthy' : 'Issue'}
                                        </Badge>
                                    </HStack>
                                    <Text fontSize="sm" color="gray.600" mb={2}>
                                        Active provider: {healthResponse?.data?.activeProvider || 'n/a'}
                                    </Text>
                                    <Code display="block" whiteSpace="pre" p={2} w="full">
                                        {JSON.stringify(healthResponse.data, null, 2)}
                                    </Code>
                                </Box>
                            ) : (
                                <Text color="gray.500">No health check run yet.</Text>
                            )}
                        </Stack>
                    </Box>

                    <Box as="form" onSubmit={handleSubmit} p={6} borderWidth="1px" borderRadius="lg" boxShadow="sm">
                        <Stack spacing={4}>
                            <FormControl>
                                <FormLabel>Provider for this test</FormLabel>
                                <Select
                                    value={providerOverride}
                                    onChange={(event) => setProviderOverride(event.target.value)}
                                >
                                    <option value="auto">Auto (use global setting)</option>
                                    <option value="meta_api">Meta API</option>
                                    <option value="baileys_wa">Baileys WA</option>
                                </Select>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Template (Baileys only, optional)</FormLabel>
                                <Select
                                    value={templateSlug}
                                    onChange={(event) => setTemplateSlug(event.target.value)}
                                >
                                    <option value="">Default template</option>
                                    {templates.map((template) => (
                                        <option key={template.id} value={template.slug}>
                                            {template.name} ({template.slug})
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>
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
                                <Text color="gray.600" fontSize="sm">
                                    Provider used: {apiResponse?.data?.provider || 'n/a'}
                                </Text>
                                <Text color="gray.600" fontSize="sm">
                                    Fallback used: {String(Boolean(apiResponse?.data?.fallbackUsed))}
                                </Text>
                                <Code display="block" whiteSpace="pre" mt={2} p={2} w="full">
                                    {JSON.stringify(apiResponse.data, null, 2)}
                                </Code>
                            </Box>
                        ) : (
                            <Text color="gray.500">Run a test to see provider responses and errors here.</Text>
                        )}
                    </Box>
                </Stack>
            </Container>
        </>
    );
}

export default WhatsAppTestPage;
