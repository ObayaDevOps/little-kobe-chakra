import { Box, Heading, Grid, Text, Button, Stack, Flex, Image } from '@chakra-ui/react'
import Layout from '../components/Layout'
import { useCartStore } from '../lib/cartStore'
import Link from 'next/link'

export default function CartPage() {
  const { items, removeItem, clearCart } = useCartStore()
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return (
    <Layout>
      <Heading size="xl" mb={8}>ショッピングカート</Heading>
      
      {items.length === 0 ? (
        <Text>カートに商品がありません</Text>
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
                    <Text>数量: {item.quantity}</Text>
                    <Text>¥{(item.price * item.quantity).toLocaleString()}</Text>
                  </Stack>
                </Flex>
                <Button
                  colorScheme="red"
                  variant="outline"
                  onClick={() => removeItem(item._id)}
                >
                  削除
                </Button>
              </Flex>
            ))}
          </Stack>

          <Box bg="white" p={6} borderRadius="lg" boxShadow="md" h="fit-content">
            <Stack spacing={6}>
              <Heading size="lg">注文概要</Heading>
              <Flex justify="space-between">
                <Text fontWeight="bold">合計:</Text>
                <Text fontWeight="bold">¥{total.toLocaleString()}</Text>
              </Flex>
              <Button
                colorScheme="red"
                size="lg"
                as={Link}
                href="/checkout"
              >
                レジへ進む
              </Button>
              <Button
                variant="outline"
                onClick={clearCart}
              >
                カートを空にする
              </Button>
            </Stack>
          </Box>
        </Grid>
      )}
    </Layout>
  )
}