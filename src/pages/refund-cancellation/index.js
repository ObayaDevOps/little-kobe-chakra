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
      >
        <Heading as="h1" size="lg" mb={8} fontFamily="logoFont">
          Refunds & Cancellations
        </Heading>
        
        <Stack spacing={8}>
          <Box>
            <Heading size="lg" mb={4}>Order Cancellations</Heading>
            <Text>
              Orders can be cancelled within 24 hours of placement if they haven't entered the shipping process. 
              To cancel an order, please contact our support team immediately at 
              <Link href="mailto:support@littlekobe.jp" color="brand.darkRed" mx={1}>
                support@littlekobe.jp
              </Link>
              with your order number.
            </Text>
          </Box>
          
          <Box>
            <Heading size="lg" mb={4}>Return Policy</Heading>
            <Text>
              We accept returns within 14 days of delivery for unopened and unused items in their original packaging. 
              Perishable goods and special order items are final sale. Please include your original receipt and 
              contact our team to initiate a return.
            </Text>
          </Box>
          
          <Box>
            <Heading size="lg" mb={4}>Refund Process</Heading>
            <Text>
              Approved refunds will be processed within 5 business days. Refunds will be issued to the original 
              payment method. Shipping costs are non-refundable unless the return is due to our error.
            </Text>
          </Box>
          
          <Box>
            <Heading size="lg" mb={4}>Damaged Items</Heading>
            <Text>
              If you receive damaged or defective items, please contact us within 48 hours of delivery with 
              photos of the damaged product and packaging. We will arrange for a replacement or full refund.
            </Text>
          </Box>
        </Stack>
      </Box>

      <Footer />
    </Box>
  );
}
