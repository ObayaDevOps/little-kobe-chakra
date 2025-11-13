import { Box, Heading, Text, Stack, Link } from '@chakra-ui/react';
import NavBar from '@/components/Navbar';
import Head from 'next/head'
import Footer from '../../components/Footer'


export default function RefundPage() {
  return (
    <Box  bg='#fcd7d7' minH={'90vh'}>
        <Head>
          <title>Refunds & Cancellations | Little Kobe Japanese Market</title>
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
        fontFamily="nbText"
      >
        <Heading as="h1" size="lg" mb={8} fontFamily="logoFont">
          Refunds & Cancellations
        </Heading>

        <Text mb={2} fontFamily="nbText">
              Need help with an existing order? Contact us at : +256 708 109856
              and our team will do everything we can to assist.
            </Text>
        
        <Stack spacing={8}>
          <Box>
            <Heading size="lg" mb={4} fontFamily="nbText">Order Cancellations</Heading>
            <Text fontFamily="nbText">
              We currently do not accept order cancellation once a payment has been confirmed, so we kindly ask you to double-check your selections before you place an order.
            </Text>

          </Box>
          
          <Box>
            <Heading size="lg" mb={4} fontFamily="nbText">Return Policy</Heading>
            <Text fontFamily="nbText">
              We currently do not return any product once it has left our store. Because we focus on specialty food imports, every order is packed with care and handled under strict safety guidelines. Once it is delivered, we cannot re-stock it.
            </Text>

          </Box>
          
          <Box>
            <Heading size="lg" mb={4} fontFamily="nbText">Refund Process</Heading>
            <Text fontFamily="nbText">
              We currently do not issue refunds after an order has been fulfilled. Our products are specialty imports with limited availability, so once an order has shipped, the items are considered final sale.
            </Text>

          </Box>
          
          <Box>
            <Heading size="lg" mb={4} fontFamily="nbText">Damaged Items</Heading>
            <Text fontFamily="nbText">
            If you receive damaged or defective items, please contact us within 48 hours of delivery with photos of the damaged product and packaging. 
            </Text>
          </Box>
        </Stack>
      </Box>

      <Footer />
    </Box>
  );
}
