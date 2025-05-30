import { useRouter } from 'next/router'
import client from '../../../sanity/lib/client'
import { groq } from 'next-sanity'
import { Box, Heading, Grid } from '@chakra-ui/react'
import NavBar from '../../components/Navbar'
import ProductCard from '../../components/ProductCard'
import Head from 'next/head'
import { getProductDetailsByIds } from '../../lib/db'


export default function CategoryPage({ products, categoryTitle }) {
  const router = useRouter()
  
  if (router.isFallback) {
    return <div>Loading...</div>
  }

  return (
    <Box bg="#fcd7d7" minH='100vh'>
        <Head>
          <title>{categoryTitle || router.query.slug} | Little Kobe Japanese Market</title>
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

      <Box p={8}>
      <Heading size="xl" 
        fontFamily={'nbHeading'}
        mb={8}>
        {categoryTitle || router.query.slug}</Heading>
      {products.length > 0 ? (
        <Grid
          templateColumns={['1fr', 'repeat(2, 1fr)', 'repeat(3, 1fr)']}
          gap={6}
        >
          {products.map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </Grid>
      ) : (
         <Heading size="md" fontFamily="nbText" textAlign="center" py={10}>
           No products found in this category.
         </Heading>
      )}
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
  // 1. Fetch category details (including title) and associated products from Sanity
   const categoryData = await client.fetch(groq`
    *[_type == "category" && slug.current == $slug][0] {
      _id,
      title,
      "products": *[_type == "product" && references(^._id)]{
        _id,
        name,
        description,
        isPopular,
        "slug": slug.current,
        "mainImage": images[0].asset->url,
      }
    }
  `, { slug: params.slug });

  // If category doesn't exist or has no products, return empty props
  if (!categoryData || !categoryData.products || categoryData.products.length === 0) {
    return { props: { products: [], categoryTitle: categoryData?.title || params.slug } };
  }

  const sanityProducts = categoryData.products;
  const categoryTitle = categoryData.title;

  // 2. Get product IDs from Sanity results
  const productIds = sanityProducts.map(p => p._id);

  // 3. Fetch inventory data from Supabase
  const { data: inventoryData, error: dbError } = await getProductDetailsByIds(productIds);

  // Handle potential errors from the DB function call
  if (dbError) {
    console.error("Error fetching inventory data for category:", params.slug, dbError);
    // Return Sanity products without price/quantity if DB fails
    return {
        props: {
            products: sanityProducts.map(p => ({ ...p, price: undefined, quantity: undefined })),
            categoryTitle,
            error: "Failed to load product inventory."
        },
        revalidate: 10
    };
  }

  // 4. Create a map for quick lookup of inventory data by product_id
  const inventoryMap = (inventoryData || []).reduce((map, item) => {
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
      return {
        ...product,
        price: inventory?.price,
        quantity: inventory?.quantity,
      };
    })
    .filter(product => {
      const hasPrice = product.price !== null && product.price !== undefined;
      const hasQuantity = product.quantity !== null && product.quantity !== undefined;
      return hasPrice && hasQuantity;
    });

    console.log(`Fetched ${sanityProducts.length} products from Sanity for category ${params.slug}, ${products.length} remain after inventory check.`);

  // 6. Pass the filtered products and category title to the page
  return {
    props: {
      products,
      categoryTitle
    },
    revalidate: 60
  }
}