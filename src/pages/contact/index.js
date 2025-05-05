import { Box, Heading, Text, Grid, GridItem, FormControl, FormLabel, Input, Textarea, Button } from '@chakra-ui/react';
import NavBar from '@/components/Navbar';
import Head from 'next/head';


export default function ContactPage() {
  return (
    <Box bg='#fcd7d7' >
        <Head>
          <title>Contact | Little Kobe Japanese Market</title>
          <meta name="description" content="Little Kobe Japanese Market"  />
          {/* <meta name="viewport" content="width=device-width, initial-scale=1" /> */}

          <meta property="og:title" content='Little Kobe Japanese Market'/> 
          <meta property="og:description" content="Little Kobe Japanese Market" />
          <meta property="og:image" content="https://res.cloudinary.com/medoptics-image-cloud/image/upload/v1737052416/neko-logo_f5fiok.png" />
          <meta property="og:image:secure_url" content="https://res.cloudinary.com/medoptics-image-cloud/image/upload/v1737052416/neko-logo_f5fiok.png" />
                   
          
          {/* <meta property="og:image:type" content="image/png" />  */}
          <meta property="og:image:width" content="120" />
          <meta property="og:image:height" content="120" />
          {/* <meta property="og:url" content="https://www.nekosero.ug/" /> */}
          <meta property="og:type" content="website" />
        </Head>



        <NavBar />
      <Box 
        maxW="1400px" 
        mx="auto" 
        px={{ base: 4, md: 8 }} 
        py={12}
        color="black"
      >
        <Heading as="h1" size="2xl" mb={8} fontFamily="heading">
          Contact Us
        </Heading>
        
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={12}>
          <GridItem>
            <Heading size="lg" mb={4}>Get in Touch</Heading>
            <Text mb={6}>
              Have questions about our products or services? Reach out to our team and we'll respond within 24 hours.
            </Text>
            <Text fontSize="lg" fontWeight="bold" mb={2}>
              Little Kobe Japanese Market
            </Text>
            <Text>123 Sakura Street</Text>
            <Text>Tokyo, Japan 100-0001</Text>
            <Text mt={4}>Phone: +81 3-1234-5678</Text>
          </GridItem>
          
          <GridItem>
            <FormControl>
              <Grid templateColumns="repeat(1, 1fr)" gap={4}>
                <FormLabel>Name</FormLabel>
                <Input 
                  placeholder="Your name" 
                  borderColor="brand.darkRed"
                  _hover={{ borderColor: 'brand.red' }}
                />
                
                <FormLabel mt={4}>Email</FormLabel>
                <Input 
                  type="email" 
                  placeholder="your@email.com" 
                  borderColor="brand.darkRed"
                  _hover={{ borderColor: 'brand.red' }}
                />
                
                <FormLabel mt={4}>Message</FormLabel>
                <Textarea 
                  placeholder="Your message..." 
                  rows={6}
                  borderColor="brand.darkRed"
                  _hover={{ borderColor: 'brand.red' }}
                />
                
                <Button 
                  mt={6} 
                  bg="brand.red" 
                  color="brand.beige"
                  _hover={{ bg: 'brand.darkRed' }}
                  size="lg"
                >
                  Send Message
                </Button>
              </Grid>
            </FormControl>
          </GridItem>
        </Grid>
      </Box>
    </Box>
  );
}
