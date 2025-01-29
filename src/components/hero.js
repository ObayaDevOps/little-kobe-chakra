import {useRouter} from 'next/router';
import { Box, Show, Text ,Flex, Image, Heading, Link, IconButton } from '@chakra-ui/react'
import Marquee from "react-fast-marquee";


export default function Hero() {
    const router = useRouter()
    console.log('router.pathname', router.pathname)
    console.log('router.pathname equals: ', router.pathname === '/')

    return (
        <Box 
        minH={router.pathname === '/' ? '100vh' : '0vh'} 
        bg={'#fcd7d7'}
        bgImage='https://res.cloudinary.com/medoptics-image-cloud/image/upload/v1738155691/Snapinst.app_472289692_1060812559393318_6006079384320386073_n_1080_j3zpuz.jpg'
        borderBottom={router.pathname === '/' ? '0px': '0px'}
        // position={'relative'}
        >

        <Box 
         borderColor="black"
         borderTopWidth={'4px'}
         borderBottomWidth={'4px'}
         position='relative'
         top={'100vh'}
         bottom={'0px'}
         bg='white'
         >
        <Marquee autofill>
            <Text fontFamily={'nbHeading'} fontSize={'3xl'} mr={52}>
            Premium Japanese Groceries
            </Text>
            <Text fontFamily={'nbHeading'} fontSize={'3xl'} mr={52}>
            高級日本食材
            </Text>
            <Text fontFamily={'nbHeading'} fontSize={'3xl'} mr={52}>
            Imported from Japan
            </Text>
            <Text fontFamily={'nbHeading'} fontSize={'3xl'} mr={52}>
            日本から輸入
            </Text>
        </Marquee>
        </Box>

        </Box>

    );

}

