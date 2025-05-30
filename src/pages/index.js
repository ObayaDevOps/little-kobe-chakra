import { Grid, Heading, Input, InputGroup, InputLeftElement, InputRightElement, Box, Flex } from '@chakra-ui/react'
import { SearchIcon } from '@chakra-ui/icons'
import { X } from 'lucide-react'
import NavBar from '../components/Navbar'
import ProductCard from '../components/ProductCard'
import CategoryCard from '../components/CategoryCard'
import Hero from '../components/hero'
import { useState, memo, useRef } from 'react'
import client from '../../sanity/lib/client'
import { groq } from 'next-sanity'
import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import Head from 'next/head'
import Footer from '../components/Footer'
import { getProductDetailsByIds } from '../lib/db'

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

  const handleClearSearch = () => {
    setSearchQuery('')
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredPopularProducts = products.filter(product => 
    product.isPopular
  )

  return (
    <Box bg="#fcd7d7" >
        <Head>
          <title>Little Kobe Japanese Market</title>
          <meta name="description" content="Little Kobe Japanese Market"  />
          {/* <meta name="viewport" content="width=device-width, initial-scale=1" /> */}
          <link rel="icon" href="/little-kobe-logo-black.svg" />


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
      <Hero />

      
    {filteredPopularProducts.length > 0 && (
      <Box p={8} >
        <Box 
        // my={{base:20, md:28, lg: 20}}
        mt={{base:20, md:16, lg: 20}}
        >
          <Heading 
            size={{base: '2xl', lg: "2xl"}} 
            textAlign={{base: 'left', md: 'left'}}
            mt={{base: 6, md: 10, lg:2}}
            mb={{base: 6, md:8, lg: 4}}
            fontFamily={'nbHeading'}
          >
            Popular Items
          </Heading>
          <Grid
            templateColumns={['1fr', 'repeat(2, 1fr)', 'repeat(3, 1fr)']}
            gap={{base: 12, lg: 6}}
          >
            {filteredPopularProducts.map((product, index) => (
              <AnimatedProductCard 
                key={product._id} 
                product={product} 
                index={index} 
              />
            ))}
          </Grid>
        </Box>
      </Box>
    )}
      
      <Box  
      p={8}
      >
      <Box my={{base:20, md:28, lg: 20}}

      >
        <Heading 
          size={{base: '2xl', lg: "2xl"}} 
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
            size={{base: '3xl', lg: "2xl"}} 
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
            {searchQuery && (
              <InputRightElement cursor="pointer" onClick={handleClearSearch}>
                <X size={18} color="black" />
              </InputRightElement>
            )}
          </InputGroup>
        </motion.div>
      </Box>

      <Box>
        <Heading 
          size={{base: 'xl', lg: "lg"}} 
          mb={6}
          fontFamily={'nbHeading'}
            
            >All Items</Heading>
        <Grid
          templateColumns={['1fr', 'repeat(2, 1fr)', 'repeat(3, 1fr)']}
          gap={{base: 12, lg: 6}}
        >
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product, index) => (
              <AnimatedProductCard 
                key={product._id} 
                product={product} 
                index={index} 
              />
            ))
          ) : (
            <Box width="100%" textAlign="center" gridColumn="1 / -1" py={10}>
              <Heading size="md" fontFamily="nbText">No items matching your search</Heading>
            </Box>
          )}
        </Grid>
      </Box>
      </Box>
      
      <Box pt={20}>
        <Footer />
      </Box>
      

    </Box>
  )
}

export async function getStaticProps() {
  // 1. Fetch initial product details and categories from Sanity
  const [sanityProducts, categories] = await Promise.all([
    client.fetch(groq`
      *[_type == "product"]{
        _id,
        name,
        description,
        // price, // Price comes from Supabase now
        isPopular,
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
  ]);

  // 2. Get product IDs from Sanity results
  const productIds = sanityProducts.map(p => p._id);

  // 3. Fetch inventory data from Supabase using the db.js function
  const { data: inventoryData, error: dbError } = await getProductDetailsByIds(productIds);

  // Handle potential errors from the DB function call
  if (dbError) {
    console.error("Error fetching inventory data:", dbError);
    // Decide how to handle: return empty products, log, etc.
    // For now, return potentially incomplete data or empty list
    return {
        props: {
            products: [], // Or sanityProducts without inventory enrichment
            categories,
            error: "Failed to load product inventory." // Optional: Pass error message to page
        },
        revalidate: 10 // Revalidate quickly after an error
    };
  }

  // 4. Create a map for quick lookup of inventory data by product_id
  const inventoryMap = (inventoryData || []).reduce((map, item) => {
    // Make sure item has product_id before adding to map
    if (item && item.product_id) {
        map[item.product_id] = { price: item.price, quantity: item.quantity };
    } else {
        console.warn("Inventory item missing product_id:", item);
    }
    return map;
  }, {});


  // 5. Merge Sanity data with Supabase inventory and filter
  const products = sanityProducts
    .map(product => {
      const inventory = inventoryMap[product._id];
      // If inventory exists for this product ID, add price/quantity
      // Otherwise, price/quantity will be undefined
      return {
        ...product,
        price: inventory?.price,
        quantity: inventory?.quantity,
      };
    })
    .filter(product => {
      // Keep only products with non-null/undefined price AND non-null/undefined quantity
      const hasPrice = product.price !== null && product.price !== undefined;
      const hasQuantity = product.quantity !== null && product.quantity !== undefined;
      return hasPrice && hasQuantity;
    });

    // Optional: Log how many products were filtered out
    console.log(`Fetched ${sanityProducts.length} products from Sanity, ${products.length} remain after inventory check.`);


  // Pass the filtered products and categories to the page
  return {
    props: {
      products, // Contains only products with valid price and quantity
      categories
    },
    revalidate: 60 // Or your preferred revalidation time
  }
} 