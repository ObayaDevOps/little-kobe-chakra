import { Grid, Heading, Input, InputGroup, InputLeftElement, Box } from '@chakra-ui/react'
import { SearchIcon } from '@chakra-ui/icons'
import Layout from '../components/Layout'
import ProductCard from '../components/ProductCard'
import CategoryCard from '../components/CategoryCard'

import { useState } from 'react'
import client from '../../sanity/lib/client'
import { groq } from 'next-sanity'

export default function Home({ products, categories }) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Layout>
      <Box my={{base:20, md:28, lg: 32}}>
        <Heading 
          size={{base: '3xl', lg: "2xl"}} 
          textAlign={{base: 'left', md: 'left'}}
          mt={{base: 6, md: 10, lg: 10}}
          mb={{base: 6, md:8, lg: 12}}
          fontFamily={'nbHeading'}
        >
          Popular Categories
        </Heading>
        <Grid
          templateColumns={['1fr', 'repeat(2, 1fr)', 'repeat(3, 1fr)']}
          gap={6}
        >
          {categories.map(category => (
            <CategoryCard key={category._id} category={category} />
          ))}
        </Grid>
      </Box>

      <Box mt={{base: 32}}>
        <Heading 
            size={{base: '3xl', lg: "2xl"}} 
            textAlign={{base: 'left', md: 'left'}}
            mb={6}
            fontFamily={'nbHeading'}
              >
                Our Products
        </Heading>
      </Box>

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

      <Box>
        <Heading 
          size={{base: 'xl', lg: "lg"}} 
          mb={6}
          fontFamily={'nbHeading'}
            
            >Popular Items</Heading>
        <Grid
          templateColumns={['1fr', 'repeat(2, 1fr)', 'repeat(3, 1fr)']}
          gap={{base: 12, lg: 6}}
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
  const [products, categories] = await Promise.all([
    client.fetch(groq`
      *[_type == "product"]{
        _id,
        name,
        description,
        price,
        "slug": slug.current,
        "mainImage": images[0].asset->url,
        categories[]->{title}
      }
    `),
    client.fetch(groq`
      *[_type == "category"]{
        _id,
        title,
        description,
        "slug": slug.current,
        "imageUrl": image.asset->url,
        parent->{title, slug}
      }
    `)
  ])

  return {
    props: {
      products,
      categories
    },
    revalidate: 60
  }
} 