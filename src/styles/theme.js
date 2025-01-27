import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  fonts: {
    heading: "'Noto Sans JP', sans-serif",
    body: "'Noto Sans JP', sans-serif",
  },
  colors: {
    brand: {
      red: '#E64034', // Traditional Japanese red color
    }
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'bold',
      },
      variants: {
        solid: {
          bg: 'brand.red',
          color: 'white',
          _hover: {
            bg: '#CC3125'
          }
        }
      }
    }
  }
})

export default theme 