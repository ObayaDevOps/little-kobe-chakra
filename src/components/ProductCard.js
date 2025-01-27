import { Box, Image, Stack, Heading, Text, Button } from '@chakra-ui/react'
import Link from 'next/link'
import { useCartStore } from '../lib/cartStore'

export default function ProductCard({ product }) {
  const addItem = useCartStore(state => state.addItem)

  return (
    <Box
      bg="white"
      borderRadius="lg"
      boxShadow="md"
      overflow="hidden"
      _hover={{ transform: 'translateY(-4px)', transition: 'transform 0.2s' }}
    >
      <Image
        src={product.mainImage}
        alt={product.name}
        h="200px"
        w="100%"
        objectFit="cover"
      />
      <Stack p={4} spacing={3}>
        <Link href={`/products/${product.slug}`}>
          <Heading size="md" cursor="pointer">{product.name}</Heading>
        </Link>
        <Text color="gray.600" noOfLines={2}>{product.description}</Text>
        <Text fontWeight="bold">¥{product.price.toLocaleString()}</Text>
        <Button
          colorScheme="red"
          onClick={() => addItem(product)}
        >
          カートに追加
        </Button>
      </Stack>
    </Box>
  )
}