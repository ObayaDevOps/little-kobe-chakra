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
            pt={{base: 16, md: 20}}
            pb={8}
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
                        src={'https://res.cloudinary.com/medoptics-image-cloud/image/upload/v1745851600/image-black-2_m163vh.svg'}
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
                </Box>

                {/* Quick Links */}
                <Grid 
                    templateColumns="repeat(2, 1fr)" 
                    gap={6} 
                    flexBasis={{ md: '40%' }}
                >
                    <GridItem>
                        <Heading size="sm" mb={3} fontFamily="nbText">Explore</Heading>
                        <Stack spacing={2}>
                            <Link href="/location" fontSize="sm" fontFamily="nbText">Popular Items</Link>
                            <Link href="/location" fontSize="sm" fontFamily="nbText">Categories</Link>
                            <Link href="/location" fontSize="sm" fontFamily="nbText">Special Offers</Link>


                        </Stack>
                    </GridItem>
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
                            aria-label="Facebook"
                            icon={<FiFacebook />}
                            variant="outline"
                            color="currentColor"
                            _hover={{ bg: 'brand.darkRed' }}
                            borderColor="black"
                            borderWidth={'2px'}
                            borderRadius="lg"
                            boxShadow="2px 2px 0px 0px rgba(0, 0, 0, 1)"
                            
                        />
                        <IconButton
                            aria-label="Twitter"
                            icon={<FiTwitter />}
                            variant="outline"
                            color="currentColor"
                            _hover={{ bg: 'brand.darkRed' }}
                            borderColor="black"
                            borderWidth={'2px'}
                            borderRadius="lg"
                            boxShadow="2px 2px 0px 0px rgba(0, 0, 0, 1)"
                        />
                    </Flex>

                    {/* <Box>
                        <Text mb={2} fontSize="sm" fontFamily="nbText">Newsletter Signup</Text>
                        <Flex gap={2}>
                            <Input 
                                placeholder="Enter your email" 
                                size="sm" 
                                textColor='black'
                                fontFamily="nbText"
                                _placeholder={{ color: 'brand.beige' }}
                                borderColor="black"
                                borderWidth={'2px'}
                                borderRadius="lg"
                                boxShadow="2px 2px 0px 0px rgba(0, 0, 0, 1)"
                            />
                            <IconButton
                                aria-label="Subscribe"
                                icon={<FiMail />}
                                size="sm"
                                color="black"

                                borderColor="black"
                                borderWidth={'2px'}
                                borderRadius="lg"
                                boxShadow="2px 2px 0px 0px rgba(0, 0, 0, 1)"
                            />
                        </Flex>
                    </Box> */}
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
                fontFamily="nbText"
            >
                © {new Date().getFullYear()} Little Kobe. All rights reserved.
            </Text>
        </Box>
    )
}