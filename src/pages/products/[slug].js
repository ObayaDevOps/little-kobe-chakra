import { useRouter } from 'next/router'
import client from '../../../sanity/lib/client'
import { groq } from 'next-sanity'
import { Box, Image, Heading, Text, Button, Stack, SimpleGrid, Tag } from '@chakra-ui/react'
import NavBar from '../../components/Navbar'
import { useCartStore } from '../../lib/cartStore'
import NextImage from 'next/image'
import Head from 'next/head'
import { useCartToast } from '../../utils/useCartToast'
import { useState } from 'react'
import Footer from '../../components/Footer'


export default function ProductPage({ product }) {
  const router = useRouter()
  const addItem = useCartStore(state => state.addItem)
  const showCartToast = useCartToast()
  const [quantity, setQuantity] = useState(1)

  if (router.isFallback) {
    return <div>Loading...</div>
  }

  if (!product) return <div>Product not found</div>

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1)
    }
  }

  const handleIncrement = () => {
    setQuantity(prev => prev + 1)
  }

  const handleAddToCart = () => {
    addItem(product, quantity)
    showCartToast(
      'Added to cart',
      `${quantity} ${quantity === 1 ? 'item' : 'items'} of ${product.name} added to cart`
    )
    setQuantity(1) // Reset quantity after adding to cart
  }

  return (
    <Box bg="#fcd7d7" minH='100vh'>
        <Head>
          <title>{product.name}| Little Kobe Japanese Market</title>
          <meta name="description" content="Little Kobe Japanese Market"  />
          {/* <meta name="viewport" content="width=device-width, initial-scale=1" /> */}

          <meta property="og:title" content='Little Kobe Japanese Market'/> 
          <meta property="og:description" content="Little Kobe Japanese Market" />
          <meta property="og:image" content="https://res.cloudinary.com/medoptics-image-cloud/image/upload/v1737052416/neko-logo_f5fiok.png" />
          <meta property="og:image:secure_url" content="https://res.cloudinary.com/medoptics-image-cloud/image/upload/v1737052416/neko-logo_f5fiok.png" />
                   
          
          {/* <meta property="og:image:type" content="image/png" />  */}
          <meta property="og:image:width" content="120" />
          <meta property="og:image:height" content="120" />
          {/* <meta property="og:url" content="https://www.nekosero.ug/" /> */}
          <meta property="og:type" content="website" />
        </Head>

      <NavBar />

      <Box p={{base: 8, md: 20}} minH='85vh'>
      <SimpleGrid columns={[1, 1, 2]} gap={8} maxW="6xl" mx="auto">
        <Box 
        bg="white" 
        p={4} 
        
        borderColor="black"
        borderWidth={'2px'}
        borderRadius="lg"
        boxShadow="4px 4px 0px 0px rgba(0, 0, 0, 1)"
        >
          <NextImage
            src={product.mainImage}
            alt={product.name}
            width={600}
            height={600}
            objectFit="contain"
          />
        </Box>
        
        <Stack spacing={{base:4, md:6}}>
          <Heading size="xl" fontFamily={'nbHeading'}>{product.name}</Heading>
          <Text fontSize="2xl" fontFamily={'nbHeading'} fontWeight="bold">
            {product.price.toLocaleString()} UGX
          </Text>
          
          <Stack direction="row" spacing={4}>
            {product.categories?.map(category => (
              <Tag 
                key={category._id} 
                colorScheme="red" 
                fontFamily={'nbText'}
                variant={'solid'} 
                size="lg"
                borderColor="black"
                borderWidth="1px"
                boxShadow="4px 4px 0px 0px rgba(0, 0, 0, 1)"
                aria-label="category title"
                
                >
                {category.title}
              </Tag>
            ))}
          </Stack>

          <Text fontSize="lg" fontFamily={'nbText'} whiteSpace="pre-wrap">
            {product.description}
          </Text>

          <Stack direction="row" spacing={4} align="center">
            <Button
              onClick={handleDecrement}
              disabled={quantity === 1}
              borderColor="black"
              borderWidth="1px"
              boxShadow="4px 4px 0px 0px rgba(0, 0, 0, 1)"
              aria-label="Decrease quantity"
            >
              -
            </Button>
            <Text fontSize="xl" fontFamily="nbHeading" minW="40px" textAlign="center">
              {quantity}
            </Text>
            <Button
              onClick={handleIncrement}
              borderColor="black"
              borderWidth="1px"
              boxShadow="4px 4px 0px 0px rgba(0, 0, 0, 1)"
              aria-label="Increase quantity"
            >
              +
            </Button>
          </Stack>

          <Button
            colorScheme="red"
            fontFamily={'nbHeading'}
            size="lg"
            borderColor="black"
            textColor={'black'}
            borderWidth={'1px'}
            boxShadow="4px 4px 0px 0px rgba(0, 0, 0, 1)"
            onClick={handleAddToCart}
          >
            Add {quantity > 1 ? `${quantity} Items` : 'to Cart'}
          </Button>
        </Stack>
      </SimpleGrid>
    </Box>

    <Footer />

  </Box>
  )
}

export async function getStaticPaths() {
  const products = await client.fetch(groq`
    *[_type == "product"] {
      "slug": slug.current
    }
  `)

  const paths = products.map(product => ({
    params: { slug: product.slug }
  }))

  return { paths, fallback: true }
}

export async function getStaticProps({ params }) {
  const product = await client.fetch(groq`
    *[_type == "product" && slug.current == $slug][0] {
      _id,
      name,
      description,
      price,
      isPopular,
      "slug": slug.current,
      "mainImage": images[0].asset->url,
      images[] {
        asset-> {
          url,
          metadata {
            dimensions
          }
        }
      },
      categories[]->{title, _id}
    }
  `, { slug: params.slug })

  return {
    props: {
      product
    },
    revalidate: 60
  }
}