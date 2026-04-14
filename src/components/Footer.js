import { Box, Flex, Heading, Link, IconButton, Image, Text, Stack, Grid, GridItem } from '@chakra-ui/react'
import { FiInstagram, FiYoutube } from "react-icons/fi";
import { useEffect, useState } from 'react';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon–Sun

function formatTime12h(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
}

export default function Footer() {
    const [storeHours, setStoreHours] = useState([]);

    useEffect(() => {
        fetch('/api/admin/store-hours')
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data?.hours) setStoreHours(data.hours); })
            .catch(() => {});
    }, []);

    return (
        <Box 
            bg="brand.red"
            color="brand.beige"
            borderTop="4px"
            borderColor="brand.darkRed"
            pt={{base: 16, md: 24}}
            pb={{base: 16, md: 20}}
            px={{ base: 8, md: 8 }}
        >
            <Flex
                direction={{ base: 'column', md: 'row' }}
                justify="space-between"
                maxW="1400px"
                mx="auto"
                gap={8}
            >
                <Box display={{base: 'none', lg: 'flex'}}>
                    <Image
                        src={'https://cdn.sanity.io/images/is2g99zr/production/28f4560ac9c7ef77758a15eba73fd93863f637a4-837x755.svg'}
                        alt={'Little Kobe Logo'}
                        h="100px"
                        w="100px"
                        objectFit="cover"
                    />
                </Box>
                {/* Brand Info */}
                <Box flexBasis={{ md: '30%' }}>
  

                    <Heading size="lg" mb={4} fontFamily="logoFont">
                        Little Kobe Japanese Market
                    </Heading>
                    <Text fontSize="sm" lineHeight="tall" fontFamily="nbText">
                        Sourcing exceptional Japanese Ingredients since 2010. 
                    </Text>
                    <Text 
                        fontSize="sm" 
                        borderColor="brand.darkRed"
                        fontFamily="nbText"
                        lineHeight="tall"
                    >
                        © {new Date().getFullYear()} Little Kobe. All rights reserved.
                    </Text>
                </Box>

                {/* Quick Links */}
                <Grid 
                    templateColumns="repeat(2, 1fr)" 
                    gap={6} 
                    flexBasis={{ md: '40%' }}
                >

                    <GridItem>
                        <Heading size="sm" mb={3} fontFamily="nbText">Support</Heading>
                        <Stack spacing={2}>
                            <Link href="/contact" fontSize="sm" fontFamily="nbText">Contact</Link>
                            <Link href="/faq" fontSize="sm" fontFamily="nbText">FAQ</Link>
                            <Link href="/refund-cancellation" fontSize="sm" fontFamily="nbText">Refunds and Cancellations</Link>

                        </Stack>
                    </GridItem>
                </Grid>

                {/* Social & Newsletter */}
                <Box flexBasis={{ md: '30%' }}>
                    <Heading size="sm" mb={4} fontFamily="nbText">Stay Connected</Heading>
                    <Flex gap={3} mb={6}>
                        <IconButton
                            aria-label="Instagram"
                            as={Link}
                            href='https://www.instagram.com/littlekobeug/?hl=en'
                            icon={<FiInstagram />}
                            variant="outline"
                            color="black"
                            _hover={{ bg: 'brand.darkRed' }}
                            borderColor="black"
                            borderWidth={'2px'}
                            borderRadius="lg"
                            boxShadow="2px 2px 0px 0px rgba(0, 0, 0, 1)"
                        />
                        <IconButton
                            aria-label="Youtube"
                            as={Link}
                            href='https://www.youtube.com/@Yujo_Izakaya'
                            icon={<FiYoutube />}
                            variant="outline"
                            color="currentColor"
                            _hover={{ bg: 'brand.darkRed' }}
                            borderColor="black"
                            borderWidth={'2px'}
                            borderRadius="lg"
                            boxShadow="2px 2px 0px 0px rgba(0, 0, 0, 1)"
                            
                        />
                    </Flex>

                </Box>

                <Box flexBasis={{ md: '30%' }}>
                    <Heading size="sm" mb={4} fontFamily="nbText">Find Us</Heading>
                    <Text fontSize="sm" fontFamily="nbText" lineHeight="tall">
                        36 Kyadondo Rd, Kampala, Uganda
                    </Text>
                </Box>

                {storeHours.length > 0 && (
                    <Box flexBasis={{ md: '30%' }}>
                        <Heading size="sm" mb={4} fontFamily="nbText">Opening Hours</Heading>
                        <Stack spacing={1}>
                            {DISPLAY_ORDER.map(dayIndex => {
                                const row = storeHours.find(r => r.day_of_week === dayIndex);
                                if (!row) return null;
                                return (
                                    <Flex key={dayIndex} justify="space-between" gap={4}>
                                        <Text fontSize="sm" fontFamily="nbHeading" minW="36px">
                                            {DAY_LABELS[dayIndex]}
                                        </Text>
                                        <Text fontSize="sm" fontFamily="nbText" color={row.is_closed ? 'blackAlpha.600' : 'inherit'}>
                                            {row.is_closed
                                                ? 'Closed'
                                                : `${formatTime12h(row.open_time)} – ${formatTime12h(row.close_time)}`}
                                        </Text>
                                    </Flex>
                                );
                            })}
                        </Stack>
                    </Box>
                )}
            </Flex>

        </Box>
    )
}
