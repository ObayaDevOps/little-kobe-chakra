import {useRouter} from 'next/router';
import { Box, Show, Text ,Flex, Image, Heading, Link, IconButton } from '@chakra-ui/react'
import Marquee from "react-fast-marquee";


export default function Hero() {
    const router = useRouter()
    console.log('router.pathname', router.pathname)
    console.log('router.pathname equals: ', router.pathname === '/')

    return (
        <Box 
        minH={{base:'45vh' , lg: '50vh'}} 

        bg={'#fcd7d7'}
        // bgImage='https://res.cloudinary.com/medoptics-image-cloud/image/upload/v1738155691/Snapinst.app_472289692_1060812559393318_6006079384320386073_n_1080_j3zpuz.jpg'
        // bgImage='https://res.cloudinary.com/medoptics-image-cloud/image/upload/v1738747377/showa-period-1200x801_u4enh1.jpg'
        bgImage='https://res.cloudinary.com/medoptics-image-cloud/image/upload/v1738747948/pexels-apasaric-3423860_ddbmcf.jpg'
        // bgImage='https://res.cloudinary.com/medoptics-image-cloud/image/upload/v1738747987/pexels-markus-winkler-1430818-3708747_jpg0ea.jpg'
        // bgImage='https://res.cloudinary.com/medoptics-image-cloud/image/upload/v1738747952/pexels-ryutaro-5473228_sll1wz.jpg'

        bgSize={'cover'}
        bgPosition={'center'}
        
        >
            {/* <Box>
                <Text textColor={'white'} fontFamily={'nbHeading'}>
                    Buy Premium Groceries Imported from Japan
                </Text>
            </Box> */}

        <Box 
         borderColor="black"
         borderTopWidth={'4px'}
         borderBottomWidth={'4px'}
         position='relative'
         top={{base:'45vh' , lg: '50vh'}} 
         bottom={'0px'}
         bg='white'
         >
        <Marquee autofill speed={75}>
            <Text fontFamily={'nbHeading'} fontSize={'3xl'} mr={52}>
                Special Offer
            </Text>
            <Text fontFamily={'nbHeading'} fontSize={'3xl'} mr={52}>
                特別オファー
            </Text>
            <Text fontFamily={'nbHeading'} fontSize={'3xl'} mr={52}>
                Sake
            </Text>
            <Text fontFamily={'nbHeading'} fontSize={'3xl'} mr={52}>
                酒
            </Text>
            
        </Marquee>
        </Box>

        </Box>

    );

}

