import { useEffect, useState } from 'react'
import { Box, Heading, Grid, Text, Button, Stack, Flex, Image } from '@chakra-ui/react'
import NavBar from '../components/Navbar'
import { useCartStore } from '../lib/cartStore'
import Link from 'next/link'
import { FiPlus, FiMinus } from 'react-icons/fi'

export default function CartPage() {
  const [isMounted, setIsMounted] = useState(false)
  const { items, addItem, decreaseItem, removeItem, clearCart } = useCartStore()
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  return (
    <Box bg="#fcd7d7" minH='100vh'>
      <NavBar />

      <Box p={8}>
      <Heading size="xl" mb={8} fontFamily={'nbHeading'}>Shopping Cart</Heading>
      
      {items.length === 0 ? (
        <Text fontFamily={'nbHeading'}>There are no items in your cart</Text>
      ) : (
        <Grid templateColumns={['1fr', '1fr', '2fr 1fr']} gap={8}>
          <Stack spacing={6}>
            {items.map(item => (
              <Flex
                key={item._id}
                bg="white"
                p={4}
                borderColor="black"
                borderWidth={'2px'}
                borderRadius="lg"
                boxShadow="2px 2px 0px 0px rgba(0, 0, 0, 1)"
                // boxShadow="md"
                align="center"
                justify="space-between"
              >
                <Flex align="center" gap={4}>
                  <Image
                    src={item.mainImage}
                    alt={item.name}
                    boxSize="100px"
                    objectFit="contain"
                  />
                  <Stack>
                    <Heading size="md" fontFamily={'nbText'}>{item.name}</Heading>
                    <Flex align="center" gap={3}>
                      <Button
                        size="sm"
                        onClick={() => decreaseItem(item._id)}
                        aria-label="Decrease quantity"
                      >
                        <FiMinus />
                      </Button>
                      <Text>{item.quantity}</Text>
                      <Button
                        size="sm"
                        onClick={() => addItem(item)}
                        aria-label="Increase quantity"
                      >
                        <FiPlus />
                      </Button>
                    </Flex>
                    <Text fontFamily={'nbText'}>{(item.price * item.quantity || 0).toLocaleString()} UGX</Text>
                  </Stack>
                </Flex>
                <Button
                  colorScheme="red"
                  fontFamily={'nbText'}
                  variant="outline"
                  onClick={() => removeItem(item._id)}
                >
                  Delete
                </Button>
              </Flex>
            ))}
          </Stack>

          <Box bg="white" p={6} h="fit-content"
            borderColor="black"
            borderWidth={'2px'}
            borderRadius="lg"
            boxShadow="4px 4px 0px 0px rgba(0, 0, 0, 1)"
          >
            <Stack spacing={6}>
              <Heading size="lg" fontFamily={'nbHeading'}>Order Summary</Heading>
              <Flex justify="space-between">
                <Text fontWeight="bold" fontFamily={'nbText'}>Total:</Text>
                <Text fontWeight="bold" fontFamily={'nbText'}>{(total || 0).toLocaleString()} UGX</Text>
              </Flex>
              <Button
                colorScheme="red"
                size="lg"
                fontFamily={'nbText'}
                as={Link}
                href="/checkout"
                borderColor="black"
                borderWidth={'2px'}
                borderRadius="lg"
                boxShadow="2px 2px 0px 0px rgba(0, 0, 0, 1)"
              >
                Proceed to Checkout
              </Button>
              <Button
                variant="outline"
                fontFamily={'nbText'}
                onClick={clearCart}
                borderColor="black"
                borderWidth={'2px'}
                borderRadius="lg"
                boxShadow="2px 2px 0px 0px rgba(0, 0, 0, 1)"
              >
                Empty Cart
              </Button>
            </Stack>
          </Box>
        </Grid>
      )}
    </Box>
    </Box>
  )
}