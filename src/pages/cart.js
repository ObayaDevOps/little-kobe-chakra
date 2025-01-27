import { useEffect, useState } from 'react'
import { Box, Heading, Grid, Text, Button, Stack, Flex, Image } from '@chakra-ui/react'
import Layout from '../components/Layout'
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
    <Layout>
      <Heading size="xl" mb={8}>Shopping Cart</Heading>
      
      {items.length === 0 ? (
        <Text>There are no items in your cart</Text>
      ) : (
        <Grid templateColumns={['1fr', '1fr', '2fr 1fr']} gap={8}>
          <Stack spacing={6}>
            {items.map(item => (
              <Flex
                key={item._id}
                bg="white"
                p={4}
                borderRadius="lg"
                boxShadow="md"
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
                    <Heading size="md">{item.name}</Heading>
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
                    <Text>{(item.price * item.quantity || 0).toLocaleString()} UGX</Text>
                  </Stack>
                </Flex>
                <Button
                  colorScheme="red"
                  variant="outline"
                  onClick={() => removeItem(item._id)}
                >
                  Delete
                </Button>
              </Flex>
            ))}
          </Stack>

          <Box bg="white" p={6} borderRadius="lg" boxShadow="md" h="fit-content">
            <Stack spacing={6}>
              <Heading size="lg">Order Summary</Heading>
              <Flex justify="space-between">
                <Text fontWeight="bold">Total:</Text>
                <Text fontWeight="bold">{(total || 0).toLocaleString()} UGX</Text>
              </Flex>
              <Button
                colorScheme="red"
                size="lg"
                as={Link}
                href="/checkout"
              >
                Proceed to Checkout
              </Button>
              <Button
                variant="outline"
                onClick={clearCart}
              >
                Empty Cart
              </Button>
            </Stack>
          </Box>
        </Grid>
      )}
    </Layout>
  )
}