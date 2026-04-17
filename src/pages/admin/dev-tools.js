import NextLink from 'next/link';
import {
    Box,
    Button,
    Container,
    Heading,
    SimpleGrid,
    Stack,
    Text,
    Link,
    useColorModeValue,
} from '@chakra-ui/react';
import AdminNavbar from '@/components/admin/AdminNavbar';

const devTools = [
    {
        title: 'WhatsApp Connectivity Test',
        href: '/admin/whatsapp-test',
        description: 'Check live WhatsApp health, switch provider globally (Meta/Baileys), and send test messages.',
        external: false,
    },
    // {
    //     title: 'WhatsApp Templates',
    //     href: '/admin/whatsapp-templates',
    //     description: 'Create and manage reusable WhatsApp text templates for support workflows and Baileys sends.',
    //     external: false,
    // },
    {
        title: 'Supabase Connectivity Test',
        href: '/admin/supabase-test',
        description: 'Run a quick health check against Supabase to confirm service availability and latency before diagnosing API issues.',
        external: false,
    },
    {
        title: 'Pesapal Dummy Cards',
        href: 'https://cybqa.pesapal.com/PesapalIframe/PesapalIframe3/TestPayments',
        description: "Use Pesapal's sandbox card numbers when testing checkout flows without live payments.",
        external: true,
    },
];

export default function DevToolsPage() {
    const cardBg = useColorModeValue('white', 'gray.800');
    const cardBorder = useColorModeValue('gray.200', 'gray.700');

    return (
        <>
            <AdminNavbar />
            <Container maxW="5xl" py={12}>
                <Stack spacing={6}>
                    <Box>
                        <Button
                            as={NextLink}
                            href="/admin"
                            variant="ghost"
                            size="sm"
                            mb={4}
                            pl={0}
                            _hover={{ textDecoration: 'underline' }}
                        >
                            ← Back to Control Center
                        </Button>
                        <Heading as="h1" size="lg">Technical Developer Tools</Heading>
                        <Text color="gray.600" mt={2}>
                            Low-level diagnostics and integration tests. These tools are intended for developers debugging connectivity, messaging, and payment flows.
                        </Text>
                    </Box>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                        {devTools.map((tool) => (
                            <Box
                                key={tool.href}
                                borderWidth="1px"
                                borderRadius="lg"
                                borderColor={cardBorder}
                                bg={cardBg}
                                p={6}
                                boxShadow="sm"
                                display="flex"
                                flexDirection="column"
                                justifyContent="space-between"
                                transition="transform 0.15s ease, box-shadow 0.15s ease"
                                _hover={{ transform: 'translateY(-4px)', boxShadow: 'md' }}
                            >
                                <Stack spacing={3} flex="1">
                                    <Heading as="h2" size="md">{tool.title}</Heading>
                                    <Text color="gray.600">{tool.description}</Text>
                                </Stack>
                                <Box mt={6}>
                                    {tool.external ? (
                                        <Button
                                            as={Link}
                                            href={tool.href}
                                            colorScheme="teal"
                                            variant="solid"
                                            width="full"
                                            isExternal
                                        >
                                            Open
                                        </Button>
                                    ) : (
                                        <Button
                                            as={NextLink}
                                            href={tool.href}
                                            colorScheme="teal"
                                            variant="solid"
                                            width="full"
                                        >
                                            Open
                                        </Button>
                                    )}
                                </Box>
                            </Box>
                        ))}
                    </SimpleGrid>
                </Stack>
            </Container>
        </>
    );
}
