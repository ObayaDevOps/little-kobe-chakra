import { Box, Flex, Heading, Link, IconButton } from '@chakra-ui/react'
import { FiShoppingCart } from 'react-icons/fi'
import CartIcon from './cartIcon'
import Hero from './hero'



export default function Layout({ children }) {
  return (
    <Box minH="100vh" bg="#fcd7d7">
      <Flex
        as="nav"
        bg="white"
        p={4}
        // boxShadow="md"
        justifyContent="space-between"
        alignItems="center"
        borderColor="black"
        borderBottomWidth={'3px'}
      >
        <Link href="/">
          <Heading 
          size="lg"
          pl={8}
          color="red.600"
          fontFamily={'nbHeading'}
          >Little Kobe</Heading>
        </Link>
        <Flex gap={6}>
          <Link href="/cart">
            <CartIcon />
          </Link>
        </Flex>
      </Flex>
      <Hero />
      <Box p={8}>{children}</Box>
    </Box>
  )
} 