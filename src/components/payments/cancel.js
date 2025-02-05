import {
    Box,
    Card,
    CardBody,
    Heading,
    Text,
    Button,
    Icon,
    VStack,
  } from '@chakra-ui/react';
  import { WarningIcon } from '@chakra-ui/icons';
  import { useRouter } from 'next/router';
  
  export default function PaymentCancelled() {
    const router = useRouter();
  
    return (
      <Box maxW="600px" mx="auto" mt={8} px={4}>
        <Card>
          <CardBody>
            <VStack spacing={4} align="center" py={8}>
              <Icon as={WarningIcon} w={16} h={16} color="orange.500" />
              <Heading size="lg">Payment Cancelled</Heading>
              <Text color="gray.600">
                Your payment was cancelled. No charges were made.
              </Text>
              <Button
                colorScheme="blue"
                onClick={() => router.push('/')}
                size="lg"
              >
                Try Again
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </Box>
    );
  }