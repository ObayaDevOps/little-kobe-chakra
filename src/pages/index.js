import { Grid, Heading, Input, InputGroup, InputLeftElement } from '@chakra-ui/react'
import { SearchIcon } from '@chakra-ui/icons'
import Layout from '../components/Layout'
import ProductCard from '../components/ProductCard'
import { useState } from 'react'
import client from '../../sanity/lib/client'
import { groq } from 'next-sanity'

export default function Home({ products }) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Layout>
      <InputGroup mb={8}>
        <InputLeftElement pointerEvents="none">
          <SearchIcon color="gray.300" />
        </InputLeftElement>
        <Input
          placeholder="Search Products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          bg="white"
        />
      </InputGroup>
      
      <Heading size="lg" mb={6}>Popular Items</Heading>
      <Grid
        templateColumns={['1fr', 'repeat(2, 1fr)', 'repeat(3, 1fr)']}
        gap={6}
      >
        {filteredProducts.map(product => (
          <ProductCard key={product._id} product={product} />
        ))}
      </Grid>
    </Layout>
  )
}

export async function getStaticProps() {
  const products = await client.fetch(groq`
    *[_type == "product"]{
      _id,
      name,
      description,
      price,
      "slug": slug.current,
      "mainImage": images[0].asset->url,
      categories[]->{title}
    }
  `)

  return {
    props: {
      products
    },
    revalidate: 60
  }
} 