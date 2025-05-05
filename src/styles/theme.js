import { extendTheme } from '@chakra-ui/react'
import {  Unbounded, Lexend_Mega, Public_Sans, Archivo, DM_Sans, Red_Hat_Text, 
  RocknRoll_One, Work_Sans,
  Noto_Serif, Zen_Kaku_Gothic_New, Dela_Gothic_One, Murecho,
  Press_Start_2P
  } from 'next/font/google'

const neobrutalismFont1 = Unbounded({ subsets: [ 'latin' ], weight: ['400'] })
const neobrutalismFont2 = Lexend_Mega({ subsets: [ 'latin' ], weight: ['600'] })
const neobrutalismFont3 = Public_Sans({ subsets: [ 'latin' ], weight: ['400'] })
const neobrutalismFont4 = Archivo({ subsets: [ 'latin' ], weight: ['400'] })
const neobrutalismFont5Head = DM_Sans({ subsets: [ 'latin' ], weight: ['700'] })
const neobrutalismFont5Text = DM_Sans({ subsets: [ 'latin' ], weight: ['400'] })
const neobrutalismFont6 = Red_Hat_Text({ subsets: [ 'latin' ], weight: ['400'] })
const neobrutalismFont7 = Work_Sans({ subsets: [ 'latin' ], weight: ['600'] }) //Other Good Option

const logoFont = RocknRoll_One({ subsets: [ 'latin' ], weight: ['400'] })
const logoFont2 = Zen_Kaku_Gothic_New({ subsets: [ 'latin' ], weight: ['400'] })
const logoFont3= Dela_Gothic_One({ subsets: [ 'latin' ], weight: ['400'] })
const logoFont4 = Noto_Serif({ subsets: [ 'latin' ], weight: ['400'] })
const logoFont5 = Murecho({ subsets: [ 'latin' ], weight: ['400'] })
const logoFont6 = Press_Start_2P({ subsets: [ 'latin' ], weight: ['400'] })




const theme = extendTheme({
  fonts: {
    heading: "'Noto Sans JP', sans-serif",
    body: "'Noto Sans JP', sans-serif",
    logoFont: logoFont6.style.fontFamily,
    neobrutalismFont1: neobrutalismFont1.style.fontFamily,
    neobrutalismFont2: neobrutalismFont2.style.fontFamily,
    neobrutalismFont3: neobrutalismFont3.style.fontFamily,
    neobrutalismFont4: neobrutalismFont4.style.fontFamily,
    neobrutalismFont5: neobrutalismFont5Head.style.fontFamily,
    neobrutalismFont6: neobrutalismFont6.style.fontFamily,
    neobrutalismFont7: neobrutalismFont7.style.fontFamily,

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