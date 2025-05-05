import { Box, Heading, Text, Grid, GridItem, FormControl, FormLabel, Input, Textarea, Button } from '@chakra-ui/react';
import NavBar from '@/components/Navbar';
import Head from 'next/head';
import Footer from '../../components/Footer'


export default function SuccessPage() {
  return (
    <Box bg='#fcd7d7' >
        <Head>
          <title> Order Success - Thanks for your Order | Little Kobe Japanese Market</title>
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
        maxW="800px" 
        mx="auto" 
        px={{ base: 4, md: 8 }} 
        py={{base: 12, lg: 20}}
        color="black"
        minH={'100vh'}
      >
        <Heading as="h1" size="2xl" mb={8} fontFamily="heading">
          Success! Thanks for your Order
        </Heading>

        <Button
        as='a'
        href='/'
          textColor={'black'}
              borderColor="black"
              borderWidth={'2px'}
              borderRadius="lg"
              boxShadow="2px 2px 0px 0px rgba(0, 0, 0, 1)"
        >
          Back Home
        </Button>

        {/* //Show items ordered and details
        //Basket should be cleared */}
        
      </Box>

    <Footer />
    </Box>
  );
}
