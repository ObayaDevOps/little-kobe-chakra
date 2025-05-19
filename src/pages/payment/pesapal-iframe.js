'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Box,
  Container,
  Center,
  Heading,
  Spinner,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react';

import NavBar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function PesapalIframePage() {
  const router = useRouter();
  const { redirectUrl } = router.query;
  const [loading, setLoading] = useState(true);
  
  // Set iframe height based on screen size
  const iframeHeight = useBreakpointValue({ 
    base: '600px',  // Mobile
    md: '650px',    // Tablet
    lg: '750px'     // Desktop
  });

  // Handle iframe loading complete
  const handleIframeLoad = () => {
    setLoading(false);
  };

  return (
    <Box bg="#fcd7d7"  display="flex" flexDirection="column" minH={{base: '100vh'}}>
      <Head>
        <title>Complete Payment | Little Kobe Japanese Market</title>
        <meta name="description" content="Complete your payment securely with Pesapal" />
        <meta property="og:title" content="Complete Payment | Little Kobe Japanese Market" />
        <meta property="og:description" content="Complete your payment securely with Pesapal" />
        <meta property="og:image" content="https://res.cloudinary.com/medoptics-image-cloud/image/upload/v1737052416/neko-logo_f5fiok.png" />
      </Head>

      <NavBar />

      <Container 
    //   w='full'
      maxW={{base:"container.xl", md:"container.lg"}}
       py={6} flex="1"
       
       >
        <Box p={{base: 0, md: 4}} bg="white"
                    borderColor="black"
                    borderWidth={'2px'}
                    borderRadius="lg"
                    boxShadow="2px 2px 0px 0px rgba(0, 0, 0, 1)"
                    minH={{base:"85vh", md:'80vh'}}
                    my={{base:12, md: 4}}
        >
          <Heading as="h1" size="lg" textAlign="center"  mt={6} mb={6} fontFamily='nbText'>
            Complete Your Payment
          </Heading>
          
          {/* {!redirectUrl && (
            <Center p={8}>
              <Text>Missing payment URL. Please return to the payment page and try again.</Text>
            </Center>
          )} */}
          
          {redirectUrl && (
            <Box position="relative" height={iframeHeight}

            >
              {loading && (
                <Center position="absolute" top="0" left="0" width="100%" height="100%">
                  <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
                  <Text ml={4}>Loading payment gateway...</Text>
                </Center>
              )}
              
              <iframe 
                src={redirectUrl}
                width="100%"
                height="100%"
                style={{ 
                    
                    
                    border: 'none' 

                
                
                }}
                onLoad={handleIframeLoad}
                title="Pesapal Payment Gateway"
              />
            </Box>
          )}
        </Box>
      </Container>

      
      <Footer />
    </Box>
  );
} 