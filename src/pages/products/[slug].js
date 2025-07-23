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
import { getProductDetailsByIds } from '../../lib/db'


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

  // Inside ProductCard component (example assuming the issue is with price)
  // Make sure price exists and is a number before formatting
  const displayPrice = typeof product.price === 'number'
    ? product.price.toLocaleString('en-US', { style: 'currency', currency: 'UGX' }) // Or your desired locale/currency
    : 'Price not available';

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
        {/* Original image box, now hidden on mobile */}
        <Box 
          bg="white" 
          p={4} 
          borderColor="black"
          borderWidth={'2px'}
          borderRadius="lg"
          boxShadow="4px 4px 0px 0px rgba(0, 0, 0, 1)"
          display={{ base: 'none', md: 'block' }} // Show only on desktop
        >
          <Box 
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <Image
              src={product.mainImage}
              alt={product.name}
              objectFit="fit"
            />
          </Box>
        </Box>
        
        <Stack spacing={{base:4, md:6}}>
          <Heading size="xl" fontFamily={'nbHeading'}>{product.name}</Heading>
          <Text fontSize="2xl" fontFamily={'nbHeading'} fontWeight="bold">
            {displayPrice}
          </Text>
          
          <Stack direction="row" spacing={4}>
            {product.categories && (
              <Tag 
                key={product.categories._id} 
                colorScheme="red" 
                fontFamily={'nbText'}
                variant={'solid'} 
                size="lg"
                borderColor="black"
                borderWidth="1px"
                boxShadow="4px 4px 0px 0px rgba(0, 0, 0, 1)"
                aria-label="category title"
              >
                {product.categories.title}
              </Tag>
            )}
          </Stack>

          {/* New image box for mobile */}
          <Box 
            bg="white" 
            p={4} 
            borderColor="black"
            borderWidth={'2px'}
            borderRadius="lg"
            boxShadow="4px 4px 0px 0px rgba(0, 0, 0, 1)"
            display={{ base: 'block', md: 'none' }} // Show only on mobile
          >
            <Box 
              display="flex"
              justifyContent="center"
              alignItems="center"
            >
              <Image
                src={product.mainImage}
                alt={product.name}
                objectFit="fit"
              />
            </Box>
          </Box>

          <Text fontSize="lg" fontFamily={'nbText'} whiteSpace="pre-wrap">
            {product.description}
          </Text>

          <Stack spacing={4} align="center">

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
  // 1. Fetch the base product data from Sanity
  const sanityProduct = await client.fetch(groq`
    *[_type == "product" && slug.current == $slug][0] {
      _id,
      name,
      description,
      // price, // Price comes from Supabase now
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
      categories->{title, _id}
    }
  `, { slug: params.slug })

  // If no product found in Sanity, return 404
  if (!sanityProduct) {
    return { notFound: true }
  }

  // 2. Fetch inventory data from Supabase for this specific product
  const { data: inventoryData, error: dbError } = await getProductDetailsByIds([sanityProduct._id]);

  // Handle potential DB errors
  if (dbError) {
    console.error("Error fetching inventory data for product:", sanityProduct._id, dbError);
    // Treat as not found if DB fails for this single product
    return { notFound: true };
  }

  // 3. Find the inventory details for the current product
  const inventory = inventoryData && inventoryData.length > 0 ? inventoryData[0] : null;

  // 4. If no inventory data (price/quantity) found for this product, treat as not found
  if (!inventory || inventory.price === null || inventory.price === undefined || inventory.quantity === null || inventory.quantity === undefined) {
      console.warn(`Inventory data missing or incomplete for product ID: ${sanityProduct._id}. Marking as not found.`);
      return { notFound: true };
  }

  // 5. Merge Sanity data with Supabase inventory data
  const product = {
    ...sanityProduct,
    price: inventory.price,
    quantity: inventory.quantity,
  };

  // 6. Pass the complete product data to the page
  return {
    props: {
      product
    },
    revalidate: 60 // Or your preferred revalidation time
  }
}