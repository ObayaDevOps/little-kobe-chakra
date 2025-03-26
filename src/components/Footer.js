import { Box, Flex, Heading, Link, IconButton, Image, Text, Input, Stack, Grid, GridItem } from '@chakra-ui/react'
import Marquee from "react-fast-marquee";
import { FiInstagram, FiFacebook, FiTwitter, FiMail } from "react-icons/fi";

export default function Footer() {
    return (
        <Box 
            bg="brand.red"
            color="brand.beige"
            borderTop="4px"
            borderColor="brand.darkRed"
            py={8}
            px={{ base: 4, md: 8 }}
        >
            <Flex
                direction={{ base: 'column', md: 'row' }}
                justify="space-between"
                maxW="1400px"
                mx="auto"
                gap={8}
            >
                {/* Brand Info */}
                <Box flexBasis={{ md: '30%' }}>
                    <Heading size="lg" mb={4} fontFamily="heading">
                        Little Kobe Japanese Market
                    </Heading>
                    <Text fontSize="sm" lineHeight="tall">
                        Sourcing exceptional Japanese Ingredients since 2010. 
                    </Text>
                </Box>

                {/* Quick Links */}
                <Grid 
                    templateColumns="repeat(2, 1fr)" 
                    gap={6} 
                    flexBasis={{ md: '40%' }}
                >
                    <GridItem>
                        <Heading size="sm" mb={3}>Explore</Heading>
                        <Stack spacing={2}>
                            <Link href="/location" fontSize="sm">Popular Items</Link>
                            <Link href="/location" fontSize="sm">Categories</Link>
                            <Link href="/location" fontSize="sm">Special Offers</Link>


                        </Stack>
                    </GridItem>
                    <GridItem>
                        <Heading size="sm" mb={3}>Support</Heading>
                        <Stack spacing={2}>
                            <Link href="/contact" fontSize="sm">Contact</Link>
                            <Link href="/faq" fontSize="sm">FAQ</Link>
                            <Link href="/refund-cancellation" fontSize="sm">Refunds and Cancellations</Link>

                        </Stack>
                    </GridItem>
                </Grid>

                {/* Social & Newsletter */}
                <Box flexBasis={{ md: '30%' }}>
                    <Heading size="sm" mb={4}>Stay Connected</Heading>
                    <Flex gap={3} mb={6}>
                        <IconButton
                            aria-label="Instagram"
                            icon={<FiInstagram />}
                            variant="outline"
                            color="currentColor"
                            _hover={{ bg: 'brand.darkRed' }}
                        />
                        <IconButton
                            aria-label="Facebook"
                            icon={<FiFacebook />}
                            variant="outline"
                            color="currentColor"
                            _hover={{ bg: 'brand.darkRed' }}
                        />
                        <IconButton
                            aria-label="Twitter"
                            icon={<FiTwitter />}
                            variant="outline"
                            color="currentColor"
                            _hover={{ bg: 'brand.darkRed' }}
                        />
                    </Flex>

                    <Box>
                        <Text mb={2} fontSize="sm">Newsletter Signup</Text>
                        <Flex gap={2}>
                            <Input 
                                placeholder="Enter your email" 
                                size="sm" 
                                _placeholder={{ color: 'brand.beige' }}
                                borderColor="brand.darkRed"
                            />
                            <IconButton
                                aria-label="Subscribe"
                                icon={<FiMail />}
                                size="sm"
                                colorScheme="darkRed"
                            />
                        </Flex>
                    </Box>
                </Box>
            </Flex>

            {/* Copyright */}
            <Text 
                textAlign="center" 
                fontSize="sm" 
                mt={8}
                pt={6}
                borderTop="1px"
                borderColor="brand.darkRed"
            >
                © {new Date().getFullYear()} Little Kobe. All rights reserved.
            </Text>
        </Box>
    )
}