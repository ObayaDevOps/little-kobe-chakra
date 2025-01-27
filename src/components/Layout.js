import { Box, Flex, Heading, Link, IconButton } from '@chakra-ui/react'
import { FiShoppingCart } from 'react-icons/fi'
import CartIcon from './cartIcon'

export default function Layout({ children }) {
  return (
    <Box minH="100vh" bg="gray.50">
      <Flex
        as="nav"
        bg="white"
        p={4}
        boxShadow="md"
        justifyContent="space-between"
        alignItems="center"
      >
        <Link href="/">
          <Heading size="lg" color="red.600">日本ストア</Heading>
        </Link>
        <Flex gap={6}>
          <Link href="/cart">
            <CartIcon />
          </Link>
        </Flex>
      </Flex>
      <Box p={8}>{children}</Box>
    </Box>
  )
} 