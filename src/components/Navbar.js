import { Box, Flex, Heading, Link, IconButton, Image } from '@chakra-ui/react'
import { FiShoppingCart } from 'react-icons/fi'
import CartIcon from './cartIcon'



export default function NavBar() {
  return (
    <Box bg="#fcd7d7">
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
        <Box>
        <Image
            src={'https://res.cloudinary.com/medoptics-image-cloud/image/upload/v1742985497/file_dpdbum.svg'}
            alt={'Little Kobe Logo'}
            h="50px"
            w="50px"
            objectFit="cover"
          />
        </Box>
        <Link href="/">
          <Heading 
          size={{base: 'lg', md: "lg"}}
          pl={{base: 2, lg :8}}
          color="red.600"
          fontFamily={'logoFont'}
          >Little Kobe Japanese Market</Heading>
        </Link>
        <Flex gap={6}>
          <Link href="/cart">
            <CartIcon />
          </Link>
        </Flex>
      </Flex>
      {/* <Hero /> */}
      {/* <Box p={8}>{children}</Box> */}
    </Box>
  )
} 