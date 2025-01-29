import { Box, Image, Stack, Heading, Text, Button } from '@chakra-ui/react'
import Link from 'next/link'
import { useCartStore } from '../lib/cartStore'

export default function CategoryCard({ product }) {
  const addItem = useCartStore(state => state.addItem)

  return (
    <Box
    //   bg="red.500"
      bg="brand.red"

      borderColor="black"
      borderWidth={'2px'}
      borderRadius="lg"
      boxShadow="4px 4px 0px 0px rgba(0, 0, 0, 1)"
      overflow="hidden"
      _hover={{ transform: 'translateY(-4px)', transition: 'transform 0.2s' }}
    >

      <Stack p={4} spacing={3}>
        <Link href={`/products/${product.slug}`}>
          <Heading textColor={'black'} size="md" cursor="pointer" fontFamily={'nbHeading'}>{product.name}</Heading>
        </Link>
        <Text  textColor={'black'} fontFamily={'nbText'} noOfLines={2}>{product.description}</Text>
      </Stack>
    </Box>
  )
}