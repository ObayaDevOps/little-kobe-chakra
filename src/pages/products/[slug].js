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
        <Box bg="white" p={4} borderRadius="lg" boxShadow="md">
          <NextImage
            src={product.mainImage}
            alt={product.name}
            width={600}
            height={600}
            objectFit="contain"
          />
        </Box>
        
        <Stack spacing={6}>
          <Heading size="xl">{product.name}</Heading>
          <Text fontSize="2xl" fontWeight="bold">
            {product.price.toLocaleString()} UGX
          </Text>
          
          <Stack direction="row" spacing={4}>
            {product.categories?.map(category => (
              <Tag key={category._id} colorScheme="red" size="lg">
                {category.title}
              </Tag>
            ))}
          </Stack>

          <Text fontSize="lg" whiteSpace="pre-wrap">
            {product.description}
          </Text>

          <Button
            colorScheme="red"
            size="lg"
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