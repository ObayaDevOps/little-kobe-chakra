import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Text,
  useToast,
  VStack,
  Select,
  InputGroup,
  InputLeftElement,
  Heading,
} from '@chakra-ui/react';

export default function PaymentForm() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    customerEmail: '',
    customerFirstName: '',
    customerLastName: '',
    customerPhone: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/paymentDPO', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          redirectUrl: `${window.location.origin}/payment/success`,
          backUrl: `${window.location.origin}/payment/cancel`,
          reference: `ORDER-${Date.now()}`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        window.location.href = data.paymentUrl;
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      toast({
        title: 'Payment Error',
        description: err.message || 'Something went wrong',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      maxW="600px"
      mx="auto"
      mt={8}
      px={4}
    >
      <Card
        shadow="lg"
        rounded="lg"
        overflow="hidden"
        bg="white"
      >
        <CardHeader bg="blue.500" py={4}>
          <Heading size="lg" color="white" textAlign="center">
            Payment Details
          </Heading>
        </CardHeader>

        <CardBody>
          <form onSubmit={handlePayment}>
            <VStack spacing={6}>
              <FormControl isRequired>
                <FormLabel>Amount</FormLabel>
                <InputGroup>
                  <InputLeftElement
                    pointerEvents='none'
                    color='gray.300'
                    children='$'
                  />
                  <Input
                    name="amount"
                    type="number"
                    step="0.01"
                    placeholder="Enter amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                  />
                </InputGroup>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Currency</FormLabel>
                <Select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  {/* Add more currencies as needed */}
                </Select>
              </FormControl>

              <Stack direction={['column', 'row']} w="full" spacing={4}>
                <FormControl isRequired>
                  <FormLabel>First Name</FormLabel>
                  <Input
                    name="customerFirstName"
                    placeholder="First name"
                    value={formData.customerFirstName}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Last Name</FormLabel>
                  <Input
                    name="customerLastName"
                    placeholder="Last name"
                    value={formData.customerLastName}
                    onChange={handleInputChange}
                  />
                </FormControl>
              </Stack>

              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  name="customerEmail"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.customerEmail}
                  onChange={handleInputChange}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Phone Number</FormLabel>
                <Input
                  name="customerPhone"
                  type="tel"
                  placeholder="+1234567890"
                  value={formData.customerPhone}
                  onChange={handleInputChange}
                />
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                width="full"
                isLoading={loading}
                loadingText="Processing..."
              >
                Pay Now
              </Button>
            </VStack>
          </form>
        </CardBody>
      </Card>
    </Box>
  );
}