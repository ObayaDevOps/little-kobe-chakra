import { extendTheme } from '@chakra-ui/react'
import {    
  DM_Sans,
  Press_Start_2P
  } from 'next/font/google'


const neobrutalismFont5Head = DM_Sans({ subsets: [ 'latin' ], weight: ['700'] }) //in use 
const neobrutalismFont5Text = DM_Sans({ subsets: [ 'latin' ], weight: ['400'] }) //in use 


const logoFont6 = Press_Start_2P({ subsets: [ 'latin' ], weight: ['400'] })




const theme = extendTheme({
  fonts: {

    logoFont: logoFont6.style.fontFamily,
    nbHeading: neobrutalismFont5Head.style.fontFamily,
    nbText: neobrutalismFont5Text.style.fontFamily,





  },
  colors: {
    brand: {
      red: '#ff6b6b', // Traditional Japanese red color
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