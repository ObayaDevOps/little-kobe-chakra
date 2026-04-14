// import '@/styles/globals.css'

import { ChakraProvider } from '@chakra-ui/react'
import { useEffect } from 'react'
import theme from '../styles/theme'
import { useStoreStatusStore } from '../lib/storeStatusStore'

function MyApp({ Component, pageProps }) {
  const fetchStoreStatus = useStoreStatusStore(state => state.fetchStatus)

  useEffect(() => {
    fetchStoreStatus()
  }, [fetchStoreStatus])

  return (
    <ChakraProvider theme={theme}>
        <Component {...pageProps} />
    </ChakraProvider>
  )
}

export default MyApp
