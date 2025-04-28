import { Box, Flex, Heading, Link, IconButton, Image, Text } from '@chakra-ui/react'
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
              // src={'https://res.cloudinary.com/medoptics-image-cloud/image/upload/v1745850853/image_jygvmy.svg'}
              src={'https://res.cloudinary.com/medoptics-image-cloud/image/upload/v1745851600/image-black-2_m163vh.svg'}

              alt={'Little Kobe Logo'}
              h="50px"
              w="50px"
              objectFit="fit"
            />
        </Box>
        <Link href="/">
          {/* <Heading 
          fontSize={{base: '0.05rem', md: "1rem"}}
          pl={{base: 2, lg :8}}
          color="red.600"
          fontFamily={'logoFont'}
          >Little Kobe Japanese Market</Heading> */}

      <Text 
          fontSize={{base: 'md', lg: "1.5rem"}}
          ml={{base: 2, lg :8}}
          // color="red.600"
          color="black"

          fontWeight={'600'}
          textAlign={'center'}
          fontFamily={'logoFont'}
          >Little Kobe Japanese Market
          </Text>
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