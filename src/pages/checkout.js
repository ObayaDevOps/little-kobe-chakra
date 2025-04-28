import { useToast,  Select, Box, Heading, Grid, FormControl, FormLabel, Input, Button, Alert, AlertIcon, Stack, Text, Flex, Tag, FormErrorMessage } from '@chakra-ui/react'
import NavBar from '../components/Navbar'
import { useCartStore } from '../lib/cartStore'
import { useState } from 'react'
import NextLink from 'next/link'
import Head from 'next/head'
import { useRouter } from 'next/router'
import axios from 'axios'; // Using axios for API calls
import Footer from '../components/Footer'


export default function CheckoutPage() {
  const { items, clearCart } = useCartStore()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    cardNumber: '',
    phone: '',
    paymentMethod: 'CARD'
  })

  // Form validation errors
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    phone: ''
  })

  // const [isSubmitting, setIsSubmitting] = useState(false)
  // const [orderSuccess, setOrderSuccess] = useState(false)
  const router = useRouter()
  const toast = useToast()

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  //pesapal - once sucessfully paid, then need to clear the cart
  // where is the sucess callback ?

  const [loading, setLoading] = useState(false);
  // const [orderTotal, setOrderTotal] = useState(0);
  const [currency] = useState('UGX');
  const [error, setError] = useState(null);

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  const validatePhone = (phone) => {
    // Basic phone validation - can be made more specific for Uganda
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  const validateForm = () => {
    const newErrors = {
      firstName: '',
      lastName: '',
      email: '',
      address: '',
      city: '',
      phone: ''
    };
    
    let isValid = true;

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
      isValid = false;
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
      isValid = false;
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
      isValid = false;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
      isValid = false;
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number (e.g., +256XXXXXXXXX)';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({...formData, [name]: value});
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({...errors, [name]: ''});
    }
  };

  const handlePaymentPesapal = async (event) => {
    event.preventDefault();
    
    // Validate form before proceeding
    if (!validateForm()) {
      toast({
        title: 'Form validation failed',
        description: 'Please check the form for errors.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setLoading(true);
    setError(null);

    if (total <= 0) {
        setError('Cannot process payment for an empty cart or zero total.');
        setLoading(false);
        return;
    }

    const description = `Payment for ${items.length} item(s). Order Ref: ${Date.now()}`;
    
    //this needs to come from the form
    const billing_address = {
        email_address: formData.email,
        phone_number: formData.phone,
        country_code: currency,
        first_name: formData.firstName,
        last_name: formData.lastName,
        line_1: formData.address,
        city: formData.city,
    };

    if (!billing_address.email_address && !billing_address.phone_number) {
         setError('Customer email address or phone number is required to proceed.');
         setLoading(false);
         return;
    }

    const orderDetails = {
        amount: total,
        currency: currency,
        description: description,
        billing_address: billing_address,
    };

    console.log("Sending order details to backend:", orderDetails);

    try {
        const response = await axios.post('/api/payments/initiate', orderDetails, {
             headers: { 'Content-Type': 'application/json' },
             timeout: 20000,
        });

        console.log("Backend response:", response.data);

        if (response.data && response.data.redirectUrl) {
            console.log("Redirecting to Pesapal:", response.data.redirectUrl);
             // Optional: Show a success toast before redirecting
             toast({
                title: 'Redirecting to Pesapal...',
                description: "You will be redirected to complete your payment securely.",
                status: 'info',
                duration: 3000,
                isClosable: true,
             });
            // Add a small delay so the user sees the toast
            setTimeout(() => {
                window.location.href = response.data.redirectUrl;
            }, 1500);
        } else {
            console.error("Backend did not return a redirect URL:", response.data);
            setError(response.data?.message || 'Failed to get payment URL from server. Please try again.');
            setLoading(false);
        }
    } catch (err) {
        console.error("Error initiating payment:", err);
        let errorMessage = 'An unexpected error occurred while initiating payment.';
         if (axios.isAxiosError(err)) {
            if (err.response) {
                 console.error("Backend Error Response Data:", err.response.data);
                 console.error("Backend Error Response Status:", err.response.status);
                errorMessage = err.response.data?.message || `Server error (${err.response.status}). Please try again later.`;
            } else if (err.request) {
                console.error("No response received:", err.request);
                errorMessage = 'Could not connect to the payment server. Please check your internet connection and try again.';
            } else {
                 console.error('Axios Error', err.message);
                errorMessage = `Payment initiation failed: ${err.message}`;
            }
        } else {
             console.error('Non-Axios Error', err);
             errorMessage = err.message || errorMessage;
        }
        setError(errorMessage);
        setLoading(false);
    }
};


//  if (orderSuccess) {
//     return (
//       <Box bg="#fcd7d7" minH='100vh'>
//         <NavBar />

//         <Box p={8}>
//           <Alert status="success" variant="subtle" borderRadius="lg" mb={8}>
//             <AlertIcon />
//             Your Order has been completed! Thank you.
//           </Alert>
//           <NextLink href="/" passHref>
//             <Button colorScheme="red" fontFamily={'nbText'}>Continue Shopping</Button>
//           </NextLink>
//         </Box>
//       </Box>
//     )
//   }

  return (
    <Box bg="#fcd7d7" minH='100vh'>
        <Head>
          <title>Checkout| Little Kobe Japanese Market</title>
          <meta name="description" content="Little Kobe Japanese Market"  />
          {/* <meta name="viewport" content="width=device-width, initial-scale=1" /> */}

          <meta property="og:title" content='Little Kobe Japanese Market'/> 
          <meta property="og:description" content="Little Kobe Japanese Market" />
          <meta property="og:image" content="https://res.cloudinary.com/medoptics-image-cloud/image/upload/v1737052416/neko-logo_f5fiok.png" />
          <meta property="og:image:secure_url" content="https://res.cloudinary.com/medoptics-image-cloud/image/upload/v1737052416/neko-logo_f5fiok.png" />
                   
          
          {/* <meta property="og:image:type" content="image/png" />  */}
          <meta property="og:image:width" content="120" />
          <meta property="og:image:height" content="120" />
          {/* <meta property="og:url" content="https://www.nekosero.ug/" /> */}
          <meta property="og:type" content="website" />
        </Head>

    <NavBar />

    <Box p={8}>
      <Heading size="2xl" mb={8} fontFamily={'nbHeading'}>Checkout</Heading>
{/* 
      <Heading size="lg" mb={2} fontFamily={'nbHeading'}>Delivery Information</Heading>
      <Heading size="md" mb={8} fontFamily={'nbHeading'}>Please provide your delivery information, payment information will be entered on the next page</Heading> */}

      {error && (
        <Alert status="error" variant="subtle" borderRadius="lg" mb={6}>
          <AlertIcon />
          {error}
        </Alert>
      )}
  
      <Grid templateColumns={['1fr', '1fr', '2fr 1fr']} gap={8}>
        <Box as="form" onSubmit={handlePaymentPesapal}
              borderColor="black"
              borderWidth={'2px'}
              borderRadius="lg"
              boxShadow="4px 4px 0px 0px rgba(0, 0, 0, 1)"
              bg="white"
        >

      <Box 
        p={6}
        mb={-4}
      >
        <Heading 
          size="lg"  
          mb={2} 
          fontFamily={'nbHeading'}
        >
          Delivery Information
        </Heading>
        <Text 
           
          fontFamily={'nbHeading'}
          >
          Please provide your delivery information, payment information will be entered on the next page
          </Text>
      </Box>


          <Stack spacing={6} 
          bg="white"
           p={6} 
          borderRadius="lg" boxShadow="md">
            <FormControl isRequired isInvalid={!!errors.firstName}>
              <FormLabel>First Name</FormLabel>
              <Input
                name="firstName"
                type="text"
                fontFamily={'nbText'}
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="John"
                borderColor="black"
                borderWidth={'2px'}
                borderRadius="lg"
                boxShadow="2px 2px 0px 0px rgba(0, 0, 0, 1)"
              />
              <FormErrorMessage>{errors.firstName}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.lastName}>
              <FormLabel>Last Name</FormLabel>
              <Input
                name="lastName"
                type="text"
                fontFamily={'nbText'}
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Doe"
                borderColor="black"
                borderWidth={'2px'}
                borderRadius="lg"
                boxShadow="2px 2px 0px 0px rgba(0, 0, 0, 1)"
              />
              <FormErrorMessage>{errors.lastName}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.email}>
              <FormLabel>Email Address</FormLabel>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="example@mail.com"
                borderColor="black"
                borderWidth={'2px'}
                borderRadius="lg"
                boxShadow="2px 2px 0px 0px rgba(0, 0, 0, 1)"
              />
              <FormErrorMessage>{errors.email}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.address}>
              <FormLabel>Address</FormLabel>
              <Input
                name="address"
                type="text"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Nakesero..."
                borderColor="black"
                borderWidth={'2px'}
                borderRadius="lg"
                boxShadow="2px 2px 0px 0px rgba(0, 0, 0, 1)"
              />
              <FormErrorMessage>{errors.address}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.city}>
              <FormLabel>City</FormLabel>
              <Input
                name="city"
                type="text"
                fontFamily={'nbText'}
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Kampala"
                borderColor="black"
                borderWidth={'2px'}
                borderRadius="lg"
                boxShadow="2px 2px 0px 0px rgba(0, 0, 0, 1)"
              />
              <FormErrorMessage>{errors.city}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.phone}>
              <FormLabel>Phone Number</FormLabel>
              <Input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+256 XXX XXX XXX"
                borderColor="black"
                borderWidth={'2px'}
                borderRadius="lg"
                boxShadow="2px 2px 0px 0px rgba(0, 0, 0, 1)"
              />
              <FormErrorMessage>{errors.phone}</FormErrorMessage>
            </FormControl>

            {/* <FormControl isRequired>
              <FormLabel>Payment Method</FormLabel>
              <Select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                borderColor="black"
                borderWidth={'2px'}
                borderRadius="lg"
              >
                <option value="CARD">Credit Card</option>
                <option value="MPESA">Mobile Money (M-Pesa)</option>
              </Select>
            </FormControl> */}

            <Button
              type="submit"
              colorScheme="brand.red"
              fontFamily={'nbText'}
              size="lg"
              isLoading={loading}
              loadingText="Processing..."
              borderColor="black"
              borderWidth={'2px'}
              borderRadius="lg"
              boxShadow="2px 2px 0px 0px rgba(0, 0, 0, 1)"
              mt={2}
            >
              Pay {currency} {total.toLocaleString()} with Pesapal
           </Button>
          </Stack>
        </Box>

        <Box bg="white" p={6} h="fit-content"
              borderColor="black"
              borderWidth={'2px'}
              borderRadius="lg"
              boxShadow="4px 4px 0px 0px rgba(0, 0, 0, 1)"
        >
          <Heading size="lg" mb={6} fontFamily={'nbHeading'}>Order Summary</Heading>
          <Stack spacing={4}>
            {items.map(item => (
              <Flex key={item._id} justify="space-between" align="center">
                <Text fontFamily={'nbText'}>
                  {item.name} <Tag>×{item.quantity}</Tag>
                </Text>
                <Text fontFamily={'nbText'}>{(item.price * item.quantity).toLocaleString()} UGX</Text>
              </Flex>
            ))}
            <Flex justify="space-between" fontWeight="bold" pt={4} borderTop="1px" borderColor="gray.100">
              <Text fontFamily={'nbHeading'}>Total:</Text>
              <Text fontFamily={'nbHeading'}>{total.toLocaleString()} UGX</Text>
            </Flex>
          </Stack>
        </Box>
      </Grid>
    </Box>

    <Footer />


    </Box>
  )
}