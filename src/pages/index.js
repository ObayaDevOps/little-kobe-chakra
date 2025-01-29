import { Grid, Heading, Input, InputGroup, InputLeftElement, Box, Flex } from '@chakra-ui/react'
import { SearchIcon } from '@chakra-ui/icons'
import NavBar from '../components/Navbar'
import ProductCard from '../components/ProductCard'
import CategoryCard from '../components/CategoryCard'
import Hero from '../components/hero'
import { useState, memo, useRef } from 'react'
import client from '../../sanity/lib/client'
import { groq } from 'next-sanity'
import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const AnimatedCategoryCard = memo(({ category, index }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={itemVariants}
      transition={{ delay: index * 0.1 }}
    >
      <CategoryCard category={category} />
    </motion.div>
  )
})

AnimatedCategoryCard.displayName = 'AnimatedCategoryCard'

const AnimatedProductCard = memo(({ product, index }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={itemVariants}
      transition={{ delay: index * 0.1 }}
    >
      <ProductCard product={product} />
    </motion.div>
  )
})

AnimatedProductCard.displayName = 'AnimatedProductCard'

export default function Home({ products, categories }) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Box bg="#fcd7d7">
      <NavBar />
      <Hero />
      <Box  
      
      p={8}
      >
      <Box my={{base:20, md:28, lg: 32}}>
        <Heading 
          size={{base: '3xl', lg: "2xl"}} 
          textAlign={{base: 'left', md: 'left'}}
          mt={{base: 6, md: 10, lg: 10}}
          mb={{base: 6, md:8, lg: 16}}
          fontFamily={'nbHeading'}
        >
          Popular Categories
        </Heading>
        <Grid
          templateColumns={['1fr', 'repeat(2, 1fr)', 'repeat(3, 1fr)']}
          gap={6}
        >
          {categories.map((category, index) => (
            <AnimatedCategoryCard 
              key={category._id} 
              category={category} 
              index={index} 
            />
          ))}
        </Grid>
      </Box>

      <Box mt={{base: 32}}>
        <Heading 
            size={{base: '4xl', lg: "2xl"}} 
            textAlign={{base: 'left', md: 'left'}}
            mb={6}
            fontFamily={'nbHeading'}
              >
                Our Products
        </Heading>
      </Box>

      <Box>
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "0px 0px -100px 0px" }}
          transition={{ duration: 0.5 }}
        >
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
        </motion.div>
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
          {filteredProducts.map((product, index) => (
            <AnimatedProductCard 
              key={product._id} 
              product={product} 
              index={index} 
            />
          ))}
        </Grid>
      </Box>
      </Box>
    </Box>
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