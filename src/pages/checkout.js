import { Box, Heading, Grid, FormControl, FormLabel, Input, Button, Alert, AlertIcon, Stack, Text, Flex, Tag } from '@chakra-ui/react'
import Layout from '../components/Layout'
import { useCartStore } from '../lib/cartStore'
import { useState } from 'react'
import NextLink from 'next/link'

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
      <Layout>
        <Alert status="success" variant="subtle" borderRadius="lg" mb={8}>
          <AlertIcon />
          注文が完了しました！ありがとうございます。
        </Alert>
        <NextLink href="/" passHref>
          <Button colorScheme="red">買い物を続ける</Button>
        </NextLink>
      </Layout>
    )
  }

  return (
    <Layout>
      <Heading size="xl" mb={8}>お支払い情報</Heading>
      
      <Grid templateColumns={['1fr', '1fr', '2fr 1fr']} gap={8}>
        <Box as="form" onSubmit={handleSubmit}>
          <Stack spacing={6} bg="white" p={6} borderRadius="lg" boxShadow="md">
            <FormControl isRequired>
              <FormLabel>氏名</FormLabel>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="山田 太郎"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>メールアドレス</FormLabel>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="example@mail.com"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>住所</FormLabel>
              <Input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="東京都渋谷区..."
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>都市</FormLabel>
              <Input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                placeholder="東京"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>クレジットカード番号</FormLabel>
              <Input
                type="text"
                pattern="[0-9]{16}"
                value={formData.cardNumber}
                onChange={(e) => setFormData({...formData, cardNumber: e.target.value})}
                placeholder="4242424242424242"
              />
            </FormControl>

            <Button
              type="submit"
              colorScheme="red"
              size="lg"
              isLoading={isSubmitting}
              loadingText="処理中..."
            >
              注文を確定する
            </Button>
          </Stack>
        </Box>

        <Box bg="white" p={6} borderRadius="lg" boxShadow="md" h="fit-content">
          <Heading size="lg" mb={6}>注文内容</Heading>
          <Stack spacing={4}>
            {items.map(item => (
              <Flex key={item._id} justify="space-between" align="center">
                <Text>
                  {item.name} <Tag>×{item.quantity}</Tag>
                </Text>
                <Text>¥{(item.price * item.quantity).toLocaleString()}</Text>
              </Flex>
            ))}
            <Flex justify="space-between" fontWeight="bold" pt={4} borderTop="1px" borderColor="gray.100">
              <Text>合計:</Text>
              <Text>¥{total.toLocaleString()}</Text>
            </Flex>
          </Stack>
        </Box>
      </Grid>
    </Layout>
  )
}