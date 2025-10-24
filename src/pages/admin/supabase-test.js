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
    NumberInput,
    NumberInputField,
    Stack,
    Text,
    useToast,
    Code,
    Badge
} from '@chakra-ui/react';

function SupabaseTestPage() {
    const toast = useToast();
    const [table, setTable] = useState('orders');
    const [columns, setColumns] = useState('*');
    const [limit, setLimit] = useState('1');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiResponse, setApiResponse] = useState(null);

    const runHealthCheck = async (event) => {
        event.preventDefault();

        if (!table.trim()) {
            toast({
                title: 'Table name required',
                description: 'Provide the table or view you want to probe.',
                status: 'warning',
                duration: 4000,
                isClosable: true,
                position: 'top'
            });
            return;
        }

        const sanitizedColumns = columns.trim() || '*';
        const parsedLimit = Number.parseInt(limit, 10);
        const safeLimit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 1;

        try {
            setIsSubmitting(true);
            setApiResponse(null);

            const params = new URLSearchParams({
                table: table.trim(),
                columns: sanitizedColumns,
                limit: String(safeLimit)
            });

            const response = await fetch(`/api/admin/supabase-health?${params.toString()}`);
            const data = await response.json().catch(() => ({ message: 'No JSON payload returned' }));
            const payload = {
                status: response.status,
                ok: response.ok,
                checkedAt: new Date().toISOString(),
                data
            };
            setApiResponse(payload);

            if (response.ok && data?.ok) {
                toast({
                    title: 'Supabase responded',
                    description: `Latency: ${data.latencyMs ?? 'n/a'} ms`,
                    status: 'success',
                    duration: 5000,
                    isClosable: true,
                    position: 'top'
                });
            } else {
                toast({
                    title: 'Supabase check failed',
                    description: data?.error?.message || 'See response details below.',
                    status: 'error',
                    duration: 6000,
                    isClosable: true,
                    position: 'top'
                });
            }
        } catch (error) {
            console.error('Failed to reach Supabase health endpoint:', error);
            setApiResponse({
                status: 'network-error',
                ok: false,
                checkedAt: new Date().toISOString(),
                data: { message: error.message }
            });
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

    const healthBadge = () => {
        if (!apiResponse) return null;
        if (apiResponse.ok && apiResponse.data?.ok) {
            return <Badge colorScheme="green">Healthy</Badge>;
        }
        return <Badge colorScheme="red">Issue detected</Badge>;
    };

    return (
        <Container maxW="lg" py={12}>
            <Stack spacing={6}>
                <Heading as="h1" size="lg">Supabase Connectivity Test</Heading>
                <Text color="gray.600">
                    Run a lightweight query against Supabase to confirm credentials, connectivity, and response latency.
                    Adjust the target table, columns, or limit as needed for your environment.
                </Text>
                <Box
                    as="form"
                    onSubmit={runHealthCheck}
                    p={6}
                    borderWidth="1px"
                    borderRadius="lg"
                    boxShadow="sm"
                >
                    <Stack spacing={4}>
                        <FormControl>
                            <FormLabel>Table or view</FormLabel>
                            <Input
                                placeholder="orders"
                                value={table}
                                onChange={(event) => setTable(event.target.value)}
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel>Columns</FormLabel>
                            <Input
                                placeholder="*"
                                value={columns}
                                onChange={(event) => setColumns(event.target.value)}
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel>Limit</FormLabel>
                            <NumberInput
                                min={1}
                                value={limit}
                                onChange={(valueString) => setLimit(valueString)}
                            >
                                <NumberInputField />
                            </NumberInput>
                        </FormControl>
                        <Button
                            type="submit"
                            colorScheme="teal"
                            isLoading={isSubmitting}
                            loadingText="Checking"
                        >
                            Run health check
                        </Button>
                    </Stack>
                </Box>

                <Divider />

                <Box>
                    <Stack direction="row" align="center" spacing={3} mb={2}>
                        <Heading as="h2" size="md">Latest response</Heading>
                        {healthBadge()}
                    </Stack>
                    {apiResponse ? (
                        <Box p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
                            <Text fontWeight="semibold">
                                Status: {apiResponse.status}{' '}
                                {apiResponse.data?.latencyMs !== undefined && `(Latency ${apiResponse.data.latencyMs} ms)`}
                            </Text>
                            <Text color="gray.600" fontSize="sm">
                                Checked at: {apiResponse.checkedAt}
                            </Text>
                            <Code display="block" whiteSpace="pre" mt={2} p={2} w="full">
                                {JSON.stringify(apiResponse.data, null, 2)}
                            </Code>
                        </Box>
                    ) : (
                        <Text color="gray.500">
                            Run a health check to view connection status and payload details here.
                        </Text>
                    )}
                </Box>
            </Stack>
        </Container>
    );
}

export default SupabaseTestPage;
