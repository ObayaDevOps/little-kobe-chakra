// import '@/styles/globals.css'


import { ChakraProvider } from '@chakra-ui/react'
import theme from '../styles/theme'
import Footer from '../components/Footer'

function MyApp({ Component, pageProps }) {
  return (
    <ChakraProvider theme={theme}>
        <Component {...pageProps} />
        <Footer />
    </ChakraProvider>
  )
}

export default MyApp 
