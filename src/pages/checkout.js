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
    setError(null); // Clear previous errors

    // 1. Validate Form
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

    if (total <= 0 || items.length === 0) {
      setError('Your cart is empty or the total is zero.');
      return;
    }

    setLoading(true); // Start loading indicator

    // 2. Prepare Cart Items for Stock Check API
    const stockCheckItems = items.map(item => ({
        // Ensure your cart item has an ID field that maps to the product ID in Supabase
        // Adjust 'item._id' if your ID field is named differently (e.g., item.id, item.productId)
        productId: item._id,
        requestedQuantity: item.quantity,
    }));

    try {
      // 3. Call Stock Check API (/api/checkout)
      console.log("Calling stock check API with items:", stockCheckItems);
      await axios.post('/api/checkout', { items: stockCheckItems }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000, // Example timeout
      });

      // 4. Stock Check Successful - Proceed to Payment Initiation
      console.log("Stock check successful. Proceeding to payment initiation.");

      // Extract item names, quantities, and prices, format the price
      const itemDetails = items.map(item => `${item.name} x${item.quantity} (${currency} ${item.price.toLocaleString()})`).join(', '); 
      const description = `Payment for: ${itemDetails}. Order Ref: ${Date.now()}`; // Updated description with item names, quantities, and prices
      const billing_address = {
        email_address: formData.email,
        phone_number: formData.phone,
        country_code: 'UG', // Assuming UGX implies Uganda
        first_name: formData.firstName,
        last_name: formData.lastName,
        line_1: formData.address,
        city: formData.city,
      };

      // Prepare the *full* order details payload for the initiate API
      const orderDetailsPayload = {
        amount: total,
        currency: currency,
        description: description, // Use the concise description for Pesapal
        billing_address: billing_address,
        items: items.map(item => ({ // Send necessary item details
          _id: item._id, // Or productId, match your identifier
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          // Add other relevant fields like SKU if needed
        })),
      };

      // 5. Call Payment Initiation API (/api/payments/initiate)
      console.log("Sending order details payload to payment initiation:", orderDetailsPayload);
      const paymentResponse = await axios.post('/api/payments/initiate', orderDetailsPayload, { // Send the full payload
        headers: { 'Content-Type': 'application/json' },
        timeout: 20000,
      });

      console.log("Payment initiation response:", paymentResponse.data);

      if (paymentResponse.data && paymentResponse.data.redirectUrl) {
        toast({
          title: 'Redirecting to Pesapal...',
          description: "Stock confirmed. You'll be redirected to complete payment.",
          status: 'info',
          duration: 3000,
          isClosable: true,
           // ... rest of toast style ...
        });
        setTimeout(() => {
          window.location.href = `/payment/pesapal-iframe?redirectUrl=${encodeURIComponent(paymentResponse.data.redirectUrl)}`;
        }, 1500);
        // No setLoading(false) here as we are navigating away
        return; // Stop execution after redirect setup
      } else {
        console.error("Payment initiation did not return a redirect URL:", paymentResponse.data);
        setError(paymentResponse.data?.message || 'Failed to get payment URL after stock check. Please try again.');
        // NOTE: Stock was decremented but payment initiation failed. This needs careful handling (e.g., backend rollback attempt or manual intervention).
      }

    } catch (err) {
      console.error("Error during checkout process:", err);
      let errorMessage = 'An unexpected error occurred.';
      let errorStatus = 500; // Default

      if (axios.isAxiosError(err)) {
        errorStatus = err.response?.status;
         console.error("Axios Error Details:", {
             status: err.response?.status,
             data: err.response?.data,
             request: err.request ? 'Request made but no response' : 'No request info',
             message: err.message
         });

        // Check if the error came from the stock check API specifically
        if (err.config?.url === '/api/checkout') {
          if (errorStatus === 409) { // Insufficient Stock
            errorMessage = err.response?.data?.message || `Insufficient stock for one or more items. Please review your cart.`;
            // Optionally, use err.response?.data?.productId to highlight the item
             toast({ title: 'Stock Issue', description: errorMessage, status: 'error', duration: 5000, isClosable: true });
          } else if (errorStatus === 404) { // Product Not Found
             errorMessage = err.response?.data?.message || `One or more products in your cart were not found. Please refresh or contact support.`;
             toast({ title: 'Product Not Found', description: errorMessage, status: 'error', duration: 5000, isClosable: true });
          } else if (errorStatus === 400) { // Bad Request (e.g., invalid cart format)
             errorMessage = err.response?.data?.message || `There was an issue with your cart data.`;
             toast({ title: 'Invalid Cart', description: errorMessage, status: 'error', duration: 5000, isClosable: true });
          } else { // Other server errors during stock check
             errorMessage = err.response?.data?.message || `Failed to verify stock (Error ${errorStatus}). Please try again later.`;
              toast({ title: 'Stock Check Failed', description: errorMessage, status: 'error', duration: 5000, isClosable: true });
          }
          setError(errorMessage); // Set the main error state as well

        } else { // Error likely from payment initiation or network issue
          if (err.response) {
            errorMessage = err.response.data?.message || `Payment server error (${errorStatus}). Please try again.`;
          } else if (err.request) {
            errorMessage = 'Could not connect to the server. Please check your connection.';
          } else {
            errorMessage = `Checkout failed: ${err.message}`;
          }
           setError(errorMessage);
        }
      } else {
        console.error('Non-Axios Error', err);
        errorMessage = err.message || errorMessage;
         setError(errorMessage);
      }
    } finally {
       // Ensure loading is turned off unless already navigating away
       if (!window.location.href.includes('/payment/pesapal-iframe')) {
           setLoading(false);
       }
    }
  };


  return (
    <Box bg="#fcd7d7" minH='100vh'>
        <Head>
          <title>Checkout  Little Kobe Japanese Market</title>
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

    <Box p={{base: 2, md: 8}}>
      <Heading size="2xl" mb={8} fontFamily={'nbHeading'} p={2} mt={4}>Checkout</Heading>

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
              mb={{base: 16, lg :40}} 

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
              isDisabled={loading || items.length === 0}
            >
              {loading ? 'Processing...' : `Pay ${currency} ${total.toLocaleString()} with Pesapal`}
           </Button>
          </Stack>
        </Box>

        <Box bg="white" p={6}
        h="fit-content"
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