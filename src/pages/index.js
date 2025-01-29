import { Grid, Heading, Input, InputGroup, InputLeftElement, Box } from '@chakra-ui/react'
import { SearchIcon } from '@chakra-ui/icons'
import Layout from '../components/Layout'
import ProductCard from '../components/ProductCard'
import CategoryCard from '../components/CategoryCard'

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
      <Box>
        <InputGroup mb={8} borderColor="black"
              borderWidth={'0.5px'}
              borderRadius="lg">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="black" />
          </InputLeftElement>
          <Input
            placeholder="Search Products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            bg="white"
            fontFamily={'nbText'}
          />
        </InputGroup>
      </Box>

      <Box mb={12}>
        <Heading 
          size="lg" 
          mb={6}
          fontFamily={'nbHeading'}
            
            >Product Categories
            </Heading>
        <Grid
          templateColumns={['1fr', 'repeat(2, 1fr)', 'repeat(3, 1fr)']}
          gap={6}
        >
          {filteredProducts.map(product => (
            <CategoryCard key={product._id} product={product} />
          ))}
        </Grid>
      </Box>



      <Box>
        <Heading 
          size="lg" 
          mb={6}
          fontFamily={'nbHeading'}
            
            >Popular Items</Heading>
        <Grid
          templateColumns={['1fr', 'repeat(2, 1fr)', 'repeat(3, 1fr)']}
          gap={6}
        >
          {filteredProducts.map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </Grid>
      </Box>
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