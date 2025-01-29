 import { Box, Image, Stack, Heading, Text, Button } from '@chakra-ui/react'
import Link from 'next/link'
import { useCartStore } from '../lib/cartStore'

export default function ProductCard({ product }) {
  const addItem = useCartStore(state => state.addItem)

  return (
    <Box
      bg="brand.red"
      borderColor="black"
      borderWidth={'2px'}
      borderRadius="lg"
      boxShadow="4px 4px 0px 0px rgba(0, 0, 0, 1)"
      overflow="hidden"
      _hover={{ transform: 'translateY(-4px)', transition: 'transform 0.2s' }}
    >
      <Box 
            borderColor="black"
            borderBottomWidth={'2px'}
      >
        <Link href={`/products/${product.slug}`}>
          <Image
            src={product.mainImage}
            alt={product.name}
            h="350px"
            w="100%"
            objectFit="cover"
          />
        </Link>

      </Box>
      <Stack p={4} spacing={3}>
        <Link href={`/products/${product.slug}`}>
          <Heading size="md" cursor="pointer" fontFamily={'nbHeading'}>{product.name}</Heading>
        </Link>
        <Text color="black" fontFamily={'nbText'} noOfLines={2}>{product.description}</Text>
        <Text fontWeight="bold" fontFamily={'nbHeading'}>{product.price.toLocaleString()} UGX</Text>
        <Button
        mt={4}
          colorScheme="green"
          bgColor={'#fcd7d7'}
          fontFamily={'nbHeading'}
          onClick={() => addItem(product)}
          borderColor="black"
          textColor={'black'}
          borderWidth={'1px'}
          boxShadow="4px 4px 0px 0px rgba(0, 0, 0, 1)"

        >
          Add to Cart
        </Button>
      </Stack>
    </Box>
  )
}