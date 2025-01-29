import { useRouter } from 'next/router'
import client from '../../../sanity/lib/client'
import { groq } from 'next-sanity'
import { Box, Image, Heading, Text, Button, Stack, SimpleGrid, Tag } from '@chakra-ui/react'
import Layout from '../../components/Layout'
import { useCartStore } from '../../lib/cartStore'
import NextImage from 'next/image'

export default function ProductPage({ product }) {
  const router = useRouter()
  const addItem = useCartStore(state => state.addItem)

  if (router.isFallback) {
    return <div>Loading...</div>
  }

  if (!product) return <div>Product not found</div>

  return (
    <Layout>
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
                size="lg">
                {category.title}
              </Tag>
            ))}
          </Stack>

          <Text fontSize="lg" fontFamily={'nbText'} whiteSpace="pre-wrap">
            {product.description}
          </Text>

          <Button
            colorScheme="red"
            fontFamily={'nbHeading'}
            size="lg"
            borderColor="black"
            textColor={'black'}
            borderWidth={'1px'}
            boxShadow="4px 4px 0px 0px rgba(0, 0, 0, 1)"
            onClick={() => addItem(product)}
          >
            Add to Cart
          </Button>
        </Stack>
      </SimpleGrid>
    </Layout>
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