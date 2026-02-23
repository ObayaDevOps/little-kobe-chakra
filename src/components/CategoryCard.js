import { Box, Image, Stack, Heading, Text } from '@chakra-ui/react'
import Link from 'next/link'

export default function CategoryCard({ category }) {
  return (
    <Link href={`/categories/${category.slug}`} style={{ display: 'block', height: '100%' }}>
      <Box
        bg="brand.red"
        borderColor="black"
        borderWidth={'2px'}
        borderRadius="lg"
        boxShadow="4px 4px 0px 0px rgba(0, 0, 0, 1)"
        overflow="hidden"
        _hover={{ transform: 'translateY(-4px)', transition: 'transform 0.2s' }}
        h="100%"
        display="flex"
        flexDirection="column"
        cursor="pointer"
      >
        <Box 
              borderColor="black"
              borderBottomWidth={'2px'}
        >
            {category.imageUrl && (
              <Image
                src={category.imageUrl}
                alt={category.title}
                objectFit="cover"
                height="200px"
                width="100%"
              />
            )}
        </Box>

        <Stack p={4} spacing={3} flexGrow={1}>
          <Heading 
            textColor={'black'} 
            size="md" 
            fontFamily={'nbHeading'}
          >
            {category.title}
          </Heading>
          <Text 
            textColor={'black'} 
            fontFamily={'nbText'} 
            noOfLines={2}
          >
            {category.description}
          </Text>
        </Stack>
      </Box>
    </Link>
  )
}
