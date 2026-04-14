import NextLink from 'next/link';
import {
    Box,
    Button,
    Container,
    Heading,
    SimpleGrid,
    Stack,
    Text,
    useColorModeValue
} from '@chakra-ui/react';
import AdminNavbar from '@/components/admin/AdminNavbar';

const adminTools = [
    {
        title: 'Inventory Manager',
        href: '/admin/inventory',
        description: 'Search, edit, and publish product stock levels pulled from Sanity. Use this to keep pricing and availability in sync.'
    },
    {
        title: 'Orders & Sales',
        href: '/admin/orders-and-sales',
        description: 'View Orders, Generate product sales totals to identify best sellers and restock needs. Pulls aggregated order data from Supabase.'
    },
    {
        title: 'Store Hours',
        href: '/admin/store-hours',
        description: 'Set open and close times per day of the week (EAT timezone). When the shop is outside these hours, customers see a closed notice and cannot place orders.'
    },
    {
        title: 'Technical Developer Tools',
        href: '/admin/dev-tools',
        description: 'WhatsApp diagnostics, Supabase connectivity tests, and Pesapal sandbox cards. For developers debugging integrations.'
    }
];

function AdminLandingPage() {
    const cardBg = useColorModeValue('white', 'gray.800');
    const cardBorder = useColorModeValue('gray.200', 'gray.700');

    return (
        <>
            <AdminNavbar />
            <Container maxW="5xl" py={12}>
            <Stack spacing={6}>
                <Heading as="h1" size="lg">Admin Control Center</Heading>
                <Text color="gray.600">
                    Launch the operational tools for Little Kobe. Each module below links to a focused workflow—use this page as the quick start hub for daily checks and maintenance.
                </Text>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    {adminTools.map((tool) => (
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
                                <Text color="gray.600">
                                    {tool.description}
                                </Text>
                            </Stack>
                            <Box mt={6}>
                                <Button
                                    as={NextLink}
                                    href={tool.href}
                                    colorScheme="teal"
                                    variant="solid"
                                    width="full"
                                >
                                    Open
                                </Button>
                            </Box>
                        </Box>
                    ))}
                </SimpleGrid>

            </Stack>
        </Container>
        </>
    );
}

export default AdminLandingPage;
