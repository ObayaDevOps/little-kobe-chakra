import { useEffect, useState, useRef } from 'react'
import { Box, Heading, Grid, Text, Button, Stack, Flex, Image, Show, 
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader,
  AlertDialogContent, AlertDialogOverlay } from '@chakra-ui/react'
import NavBar from '../components/Navbar'
import { useCartStore } from '../lib/cartStore'
import Link from 'next/link'
import { FiPlus, FiMinus } from 'react-icons/fi'
import Head from 'next/head'
import Footer from '../components/Footer'


export default function CartPage() {
  const [isMounted, setIsMounted] = useState(false)
  const { items, addItem, decreaseItem, removeItem, clearCart } = useCartStore()
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState(null)
  const cancelRef = useRef()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleDecreaseItem = (itemId) => {
    const item = items.find(item => item._id === itemId)
    if (item && item.quantity === 1) {
      setSelectedItemId(itemId)
      setIsAlertOpen(true)
    } else {
      decreaseItem(itemId)
    }
  }

  const handleRemoveConfirm = () => {
    removeItem(selectedItemId)
    setIsAlertOpen(false)
    setSelectedItemId(null)
  }

  const handleRemoveCancel = () => {
    setIsAlertOpen(false)
    setSelectedItemId(null)
  }

  if (!isMounted) return null

  return (
    <Box bg="#fcd7d7" minH='100vh'>
        <Head>
          <title>Cart | Little Kobe Japanese Market</title>
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

      <Box p={8} minH='80vh'>
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
                        onClick={() => handleDecreaseItem(item._id)}
                        aria-label="Decrease quantity"
                        borderColor="black"
                        borderWidth={'2px'}
                        borderRadius="lg"
                        boxShadow="1px 1px 0px 0px rgba(0, 0, 0, 1)"
                      >
                        <FiMinus />
                      </Button>
                      <Text>{item.quantity}</Text>
                      <Button
                        size="sm"
                        onClick={() => addItem(item)}
                        aria-label="Increase quantity"
                        borderColor="black"
                        borderWidth={'2px'}
                        borderRadius="lg"
                        boxShadow="1px 1px 0px 0px rgba(0, 0, 0, 1)"
                      >
                        <FiPlus />
                      </Button>
                    </Flex>
                    <Text fontFamily={'nbText'}>{(item.price * item.quantity || 0).toLocaleString()} UGX</Text>
                  <Show below='md'>
                    <Button
                      colorScheme="red"
                      fontFamily={'nbText'}
                      variant="outline"
                      onClick={() => removeItem(item._id)}
                      w='full'
                    >
                    Delete
                  </Button>
                </Show>
                  </Stack>
                </Flex>
                <Show above='md' >
                    <Button
                      colorScheme="red"
                      fontFamily={'nbText'}
                      variant="outline"
                      onClick={() => removeItem(item._id)}
                    >
                    Delete
                  </Button>
                </Show>
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

    <AlertDialog
      isOpen={isAlertOpen}
      leastDestructiveRef={cancelRef}
      onClose={handleRemoveCancel}
    >
      <AlertDialogOverlay>
        <AlertDialogContent
          borderColor="black"
          borderWidth="2px"
          borderRadius="lg"
          boxShadow="4px 4px 0px 0px rgba(0, 0, 0, 1)"
        >
          <AlertDialogHeader fontSize="lg" fontFamily="nbHeading">
            Remove Item
          </AlertDialogHeader>

          <AlertDialogBody fontFamily="nbText">
            Are you sure you want to remove this item from cart?
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button 
              ref={cancelRef} 
              onClick={handleRemoveCancel}
              borderColor="black"
              borderWidth="1px"
              boxShadow="2px 2px 0px 0px rgba(0, 0, 0, 1)"
              fontFamily="nbText"
            >
              Cancel
            </Button>
            <Button 
              colorScheme="red" 
              onClick={handleRemoveConfirm} 
              ml={3}
              borderColor="black"
              borderWidth="1px"
              boxShadow="2px 2px 0px 0px rgba(0, 0, 0, 1)"
              fontFamily="nbText"
            >
              Remove
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>

    <Footer />


    </Box>
  )
}