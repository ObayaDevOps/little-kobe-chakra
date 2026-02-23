import { Box, Heading, Text, Button } from '@chakra-ui/react'
import NavBar from '../components/Navbar'
import Head from 'next/head'
import Footer from '../components/Footer'
import { useRouter } from 'next/router'
import { useEnsureSearchCatalog } from '../lib/useEnsureSearchCatalog'

export default function CartPage() {
  const router = useRouter()
  useEnsureSearchCatalog()

  const handleGoHome = () => {
    router.push('/')
  }

  return (
    <Box bg="#fcd7d7" minH='100vh'>
      <Head>
        <title>Cart | Little Kobe Japanese Market</title>
        <meta name="description" content="Little Kobe Japanese Market"  />
        <meta property="og:title" content='Little Kobe Japanese Market'/> 
        <meta property="og:description" content="Little Kobe Japanese Market" />
        <meta property="og:image" content="https://res.cloudinary.com/medoptics-image-cloud/image/upload/v1737052416/neko-logo_f5fiok.png" />
        <meta property="og:image:secure_url" content="https://res.cloudinary.com/medoptics-image-cloud/image/upload/v1737052416/neko-logo_f5fiok.png" />
        <meta property="og:image:width" content="120" />
        <meta property="og:image:height" content="120" />
        <meta property="og:type" content="website" />
      </Head>

      <NavBar />

      <Box p={8} display="flex" flexDirection="column" alignItems="center" justifyContent="center" minH='80vh'>
        <Heading size="xl" mb={8} fontFamily={'nbHeading'}>Cart Updated!</Heading>
        <Text fontFamily={'nbText'} fontSize="lg" mb={6} textAlign="center">
          We've moved the shopping cart to a convenient drawer that you can access from any page.
        </Text>
        <Text fontFamily={'nbText'} fontSize="lg" mb={12} textAlign="center">
          Click the cart icon in the top right corner to view your items.
        </Text>
        
        <Button
          colorScheme="red"
          size="lg"
          fontFamily={'nbText'}
          onClick={handleGoHome}
          borderColor="black"
          borderWidth={'2px'}
          borderRadius="lg"
          boxShadow="2px 2px 0px 0px rgba(0, 0, 0, 1)"
        >
          Continue Shopping
        </Button>
      </Box>

      <Footer />
    </Box>
  )
}
