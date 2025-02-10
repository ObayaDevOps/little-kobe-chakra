import {useRouter} from 'next/router';
import { Box, Show, Text ,Flex, Image, Heading, Link, IconButton } from '@chakra-ui/react'
import Marquee from "react-fast-marquee";


export default function Hero() {
    const router = useRouter()
    console.log('router.pathname', router.pathname)
    console.log('router.pathname equals: ', router.pathname === '/')

    return (
        <Box 
        minH={{base:'45vh' , lg: '70vh'}} 

        bg={'#fcd7d7'}
        bgImage='https://res.cloudinary.com/medoptics-image-cloud/image/upload/v1738747948/pexels-apasaric-3423860_ddbmcf.jpg'
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
         top={{base:'45vh' , lg: '70vh'}} 
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

