import NextLink from 'next/link';
import { useRouter } from 'next/router';
import {
    Box,
    Button,
    Container,
    Wrap,
    WrapItem,
    useColorModeValue
} from '@chakra-ui/react';

const ADMIN_LINKS = [
    { label: 'Control Center', href: '/admin' },
    { label: 'Inventory Manager', href: '/admin/inventory' },
    { label: 'Orders & Sales', href: '/admin/orders-and-sales' },
    { label: 'WhatsApp Test', href: '/admin/whatsapp-test' },
    { label: 'Supabase Test', href: '/admin/supabase-test' }
];

const isLinkActive = (pathname, href) => {
    if (href === '/admin') {
        return pathname === '/admin' || pathname === '/admin/index';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
};

function AdminNavbar() {
    const router = useRouter();
    const barBg = useColorModeValue('gray.50', 'gray.900');
    const barBorder = useColorModeValue('gray.200', 'gray.700');
    const hoverBg = useColorModeValue('gray.200', 'gray.600');
    const activeBg = useColorModeValue('black', 'white');
    const activeColor = useColorModeValue('white', 'black');

    return (
        <Box borderBottomWidth="1px" borderColor={barBorder} bg={barBg}>
            <Container maxW="6xl" py={4}>
                <Wrap spacing={3}>
                    {ADMIN_LINKS.map((link) => {
                        const active = isLinkActive(router.pathname, link.href);
                        return (
                            <WrapItem key={link.href}>
                                <Button
                                    as={NextLink}
                                    href={link.href}
                                    size="sm"
                                    variant="ghost"
                                    bg={active ? activeBg : 'transparent'}
                                    color={active ? activeColor : undefined}
                                    _hover={{ textDecoration: 'none', bg: active ? activeBg : hoverBg }}
                                    _active={{ bg: active ? activeBg : hoverBg }}
                                >
                                    {link.label}
                                </Button>
                            </WrapItem>
                        );
                    })}
                </Wrap>
            </Container>
        </Box>
    );
}

export default AdminNavbar;
