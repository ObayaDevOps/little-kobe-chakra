import { Box, Image, Stack, Heading, Text, Button, useToast } from '@chakra-ui/react'
import Link from 'next/link'
import { useCartStore } from '../lib/cartStore'
import { useCartToast } from '../utils/useCartToast'

export default function ProductCard({ product }) {
  const addItem = useCartStore(state => state.addItem)
  const showCartToast = useCartToast()

  const handleAddToCart = () => {
    addItem(product)
    showCartToast(
      'Added to cart',
      `${product.name} has been added to your cart`
    )
  }

  // Check if price is a valid number before formatting
  const displayPrice = typeof product.price === 'number'
    ? product.price.toLocaleString('en-US', { style: 'currency', currency: 'UGX' }) // Or your desired locale/currency
    : 'Price not available'; // Fallback text

  return (
    <Box
      bg="white"
      borderColor="black"
      borderWidth={'2px'}
      borderRadius="lg"
      boxShadow="4px 4px 0px 0px rgba(0, 0, 0, 1)"
      overflow="hidden"
      _hover={{ transform: 'translateY(-4px)', transition: 'transform 0.2s' }}
      display="flex"
      flexDirection="column"
      h="100%"
    >
      <Box 
            borderColor="black"
            borderBottomWidth={'2px'}
            display="flex"
            justifyContent="center"
            alignItems="center"
      >
        <Link href={`/products/${product.slug}`}>
          <Image
            src={product.mainImage}
            alt={product.name}
            h="275px"
            w="auto"
            objectFit="fit"
          />
        </Link>
      </Box>

      <Stack 
        p={4} 
        spacing={3} 
        bg="brand.red"
        flexGrow={1}
      >
        <Link href={`/products/${product.slug}`}>
          <Heading size="md" cursor="pointer" fontFamily={'nbHeading'}>{product.name}</Heading>
        </Link>

        <Text color="black" fontFamily={'nbText'} noOfLines={2}>{product.description}</Text>
        <Text fontWeight="bold" size="xl" fontFamily={'nbHeading'}>{displayPrice}</Text>
        
        <Button
          mt="auto"
          bgColor={'#fcd7d7'}
          fontFamily={'nbHeading'}
          onClick={handleAddToCart}
          borderColor="black"
          textColor={'black'}
          borderWidth={'1px'}
          boxShadow="4px 4px 0px 0px rgba(0, 0, 0, 1)"
        >
          Add to Cart
        </Button>

        {/* <Button
        mt={0}
          colorScheme="green"
          bgColor={'#fcd7d7'}
          fontFamily={'nbHeading'}
          onClick={handleAddToCart}
          borderColor="black"
          textColor={'black'}
          borderWidth={'1px'}
          boxShadow="4px 4px 0px 0px rgba(0, 0, 0, 1)"

        >
          More Information
        </Button> */}
      </Stack>
    </Box>
  )
}