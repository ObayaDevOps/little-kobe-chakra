import { useRouter } from 'next/router'
import client from '../../../sanity/lib/client'
import { groq } from 'next-sanity'
import { Box, Heading, Grid } from '@chakra-ui/react'
import NavBar from '../../components/Navbar'
import ProductCard from '../../components/ProductCard'

export default function CategoryPage({ products }) {
  const router = useRouter()
  
  if (router.isFallback) {
    return <div>Loading...</div>
  }

  return (
    <Box bg="#fcd7d7" minH='100vh'>
      <NavBar />

      <Box p={8}>
      <Heading size="xl" mb={8}>{router.query.slug} の商品</Heading>
      <Grid
        templateColumns={['1fr', 'repeat(2, 1fr)', 'repeat(3, 1fr)']}
        gap={6}
      >
        {products.map(product => (
          <ProductCard key={product._id} product={product} />
        ))}
      </Grid>
      </Box>
    </Box>
  )
}

export async function getStaticPaths() {
  const categories = await client.fetch(groq`
    *[_type == "category"] {
      "slug": slug.current
    }
  `)

  const paths = categories.map(category => ({
    params: { slug: category.slug }
  }))

  return { paths, fallback: true }
}

export async function getStaticProps({ params }) {
  const products = await client.fetch(groq`
    *[_type == "product" && references(*[_type == "category" && slug.current == $slug]._id)] {
      _id,
      name,
      description,
      price,
      "slug": slug.current,
      "mainImage": images[0].asset->url,
      categories[]->{title}
    }
  `, { slug: params.slug })

  return {
    props: {
      products
    },
    revalidate: 60
  }
}