import {
    Box,
    Card,
    CardBody,
    Heading,
    Text,
    Icon,
    VStack,
  } from '@chakra-ui/react';
  import { CheckCircleIcon } from '@chakra-ui/icons';
  
  export default function PaymentSuccess() {
    return (
      <Box maxW="600px" mx="auto" mt={8} px={4}>
        <Card>
          <CardBody>
            <VStack spacing={4} align="center" py={8}>
              <Icon as={CheckCircleIcon} w={16} h={16} color="green.500" />
              <Heading size="lg">Payment Successful!</Heading>
              <Text color="gray.600">
                Thank you for your payment. Your transaction has been completed successfully.
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </Box>
    );
  }