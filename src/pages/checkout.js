import { Box, Heading, Grid, FormControl, FormLabel, Input, Button, Alert, AlertIcon, Stack, Text, Flex, Tag } from '@chakra-ui/react'
import NavBar from '../components/Navbar'
import { useCartStore } from '../lib/cartStore'
import { useState } from 'react'
import NextLink from 'next/link'
import Head from 'next/head'

export default function CheckoutPage() {
  const { items, clearCart } = useCartStore()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    cardNumber: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate payment processing
    setTimeout(() => {
      setIsSubmitting(false)
      setOrderSuccess(true)
      clearCart()
    }, 2000)
  }

  if (orderSuccess) {
    return (
      <Box bg="#fcd7d7" minH='100vh'>
        <NavBar />

        <Box p={8}>
          <Alert status="success" variant="subtle" borderRadius="lg" mb={8}>
            <AlertIcon />
            Your Order has been completed! Thank you.
          </Alert>
          <NextLink href="/" passHref>
            <Button colorScheme="red" fontFamily={'nbText'}>Continue Shopping</Button>
          </NextLink>
        </Box>
      </Box>
    )
  }

  return (
    <Box bg="#fcd7d7" minH='100vh'>#
        <Head>
          <title>Checkout| Little Kobe Japanese Market</title>
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

    <Box p={8}>
      <Heading size="xl" mb={8} fontFamily={'nbHeading'}>Payment Information</Heading>
      
      <Grid templateColumns={['1fr', '1fr', '2fr 1fr']} gap={8}>
        <Box as="form" onSubmit={handleSubmit}
              borderColor="black"
              borderWidth={'2px'}
              borderRadius="lg"
              boxShadow="4px 4px 0px 0px rgba(0, 0, 0, 1)"
        >
          <Stack spacing={6} bg="white" p={6} borderRadius="lg" boxShadow="md">
            <FormControl isRequired>
              <FormLabel>Full Name</FormLabel>
              <Input
                type="text"
                fontFamily={'nbText'}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="John Doe"
                borderColor="black"
                borderWidth={'2px'}
                borderRadius="lg"
                boxShadow="2px 2px 0px 0px rgba(0, 0, 0, 1)"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Email Address</FormLabel>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="example@mail.com"
                borderColor="black"
                borderWidth={'2px'}
                borderRadius="lg"
                boxShadow="2px 2px 0px 0px rgba(0, 0, 0, 1)"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Address</FormLabel>
              <Input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Nakesero..."
                borderColor="black"
                borderWidth={'2px'}
                borderRadius="lg"
                boxShadow="2px 2px 0px 0px rgba(0, 0, 0, 1)"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>City</FormLabel>
              <Input
                type="text"
                fontFamily={'nbText'}
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                placeholder="Kampala"
                borderColor="black"
                borderWidth={'2px'}
                borderRadius="lg"
                boxShadow="2px 2px 0px 0px rgba(0, 0, 0, 1)"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Credit Card Number</FormLabel>
              <Input
                type="text"
                fontFamily={'nbText'}
                pattern="[0-9]{16}"
                value={formData.cardNumber}
                onChange={(e) => setFormData({...formData, cardNumber: e.target.value})}
                placeholder="4242424242424242"
                borderColor="black"
                borderWidth={'2px'}
                borderRadius="lg"
                boxShadow="2px 2px 0px 0px rgba(0, 0, 0, 1)"
              />
            </FormControl>

            <Button
              type="submit"
              colorScheme="brand.red"
              fontFamily={'nbText'}
              size="lg"
              isLoading={isSubmitting}
              loadingText="Processing..."
              borderColor="black"
                borderWidth={'2px'}
                borderRadius="lg"
                boxShadow="2px 2px 0px 0px rgba(0, 0, 0, 1)"
            >
              Confirm Order
            </Button>
          </Stack>
        </Box>

        <Box bg="white" p={6} h="fit-content"
              borderColor="black"
              borderWidth={'2px'}
              borderRadius="lg"
              boxShadow="4px 4px 0px 0px rgba(0, 0, 0, 1)"
        >
          <Heading size="lg" mb={6} fontFamily={'nbHeading'}>Order Summary</Heading>
          <Stack spacing={4}>
            {items.map(item => (
              <Flex key={item._id} justify="space-between" align="center">
                <Text fontFamily={'nbText'}>
                  {item.name} <Tag>×{item.quantity}</Tag>
                </Text>
                <Text fontFamily={'nbText'}>{(item.price * item.quantity).toLocaleString()} UGX</Text>
              </Flex>
            ))}
            <Flex justify="space-between" fontWeight="bold" pt={4} borderTop="1px" borderColor="gray.100">
              <Text fontFamily={'nbHeading'}>Total:</Text>
              <Text fontFamily={'nbHeading'}>{total.toLocaleString()} UGX</Text>
            </Flex>
          </Stack>
        </Box>
      </Grid>
    </Box>
    </Box>
  )
}