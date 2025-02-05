import { useRouter } from 'next/router'
import client from '../../../sanity/lib/client'
import { groq } from 'next-sanity'
import { Box, Heading, Grid } from '@chakra-ui/react'
import NavBar from '../../components/Navbar'
import ProductCard from '../../components/ProductCard'
import Head from 'next/head'


export default function CategoryPage({ products }) {
  const router = useRouter()
  
  if (router.isFallback) {
    return <div>Loading...</div>
  }

  return (
    <Box bg="#fcd7d7" minH='100vh'>
        <Head>
          <title>{router.query.slug} | Little Kobe Japanese Market</title>
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
      <Heading size="xl" mb={8}>{router.query.slug}</Heading>
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