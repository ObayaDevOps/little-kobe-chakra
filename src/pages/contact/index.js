import { Box, Heading, Text, Grid, GridItem, FormControl, FormLabel, Input, Textarea, Button, useToast } from '@chakra-ui/react';
import NavBar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Head from 'next/head';
import { useState } from 'react';


export default function ContactPage() {
  const toast = useToast();
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field) => (event) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/nodemailer-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Name: formValues.name,
          Email: formValues.email,
          PhoneNumber: formValues.phone,
          Message: formValues.message,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      toast({
        title: 'Message sent!',
        description: 'Thanks for reaching out. We will get back to you shortly.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      setFormValues({
        name: '',
        email: '',
        phone: '',
        message: '',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Failed to send message',
        description: 'Please try again later or contact us directly.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box bg="#fcd7d7" fontFamily="nbText">
        <Head>
          <title>Contact | Little Kobe Japanese Market</title>
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
      <Box 
        maxW="1400px" 
        mx="auto" 
        px={{ base: 4, md: 8 }} 
        py={12}
        color="black"
      >
        <Heading as="h1" size="2xl" mb={8} fontFamily="nbHeading">
          Contact Us
        </Heading>
        
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={12}>
          <GridItem>
            <Heading size="lg" mb={4} fontFamily="nbHeading">Get in Touch</Heading>
            <Text mb={6} fontFamily="nbText">
              Have questions about our products or services? Reach out to our team and we'll respond within 24 hours.
            </Text>
            <Text fontSize="lg" fontWeight="bold" mb={2} fontFamily="nbHeading">
              Little Kobe Japanese Market
            </Text>
            <Text fontFamily="nbText">36 Kyadondo Road, Kampala</Text>
            <Text mt={4} fontFamily="nbText">Phone: +256 708 109856</Text>
          </GridItem>
          
          <GridItem>
            <form onSubmit={handleSubmit}>
              <FormControl>
                <Grid templateColumns="repeat(1, 1fr)" gap={4}>
                  <FormLabel fontFamily="nbHeading" fontSize="xl">Name</FormLabel>
                  <Input 
                    placeholder="Your name" 
                    borderColor="black"
                    borderWidth="2px"
                    borderRadius="lg"
                    boxShadow="2px 2px 0px rgba(0, 0, 0, 1)"
                    bg="white"
                    fontFamily="nbText"
                    value={formValues.name}
                    onChange={handleChange('name')}
                    isRequired
                  />
                  
                  <FormLabel mt={4} fontFamily="nbHeading" fontSize="xl">Email</FormLabel>
                  <Input 
                    type="email" 
                    placeholder="your@email.com" 
                    borderColor="black"
                    borderWidth="2px"
                    borderRadius="lg"
                    boxShadow="2px 2px 0px rgba(0, 0, 0, 1)"
                    bg="white"
                    fontFamily="nbText"
                    value={formValues.email}
                    onChange={handleChange('email')}
                    isRequired
                  />

                  <FormLabel mt={4} fontFamily="nbHeading" fontSize="xl">Phone Number</FormLabel>
                  <Input 
                    type="tel" 
                    placeholder="+256 708 109856" 
                    borderColor="black"
                    borderWidth="2px"
                    borderRadius="lg"
                    boxShadow="2px 2px 0px rgba(0, 0, 0, 1)"
                    bg="white"
                    fontFamily="nbText"
                    value={formValues.phone}
                    onChange={handleChange('phone')}
                  />
                  
                  <FormLabel mt={4} fontFamily="nbHeading" fontSize="xl">Message</FormLabel>
                  <Textarea 
                    placeholder="Your message..." 
                    rows={6}
                    borderColor="black"
                    borderWidth="2px"
                    borderRadius="lg"
                    boxShadow="2px 2px 0px rgba(0, 0, 0, 1)"
                    bg="white"
                    fontFamily="nbText"
                    value={formValues.message}
                    onChange={handleChange('message')}
                    isRequired
                  />
                  
                  <Button 
                    mt={6} 
                    bg="brand.red"
                    color="brand.beige"
                    borderColor="black"
                    borderWidth="2px"
                    boxShadow="4px 4px 0px rgba(0, 0, 0, 1)"
                    _hover={{ bg: '#cc4a4a', transform: 'translateY(-2px)' }}
                    _active={{ transform: 'translateY(0)' }}
                    transition="transform 0.2s ease"
                    size="lg"
                    fontFamily="nbHeading"
                    type="submit"
                    isLoading={isSubmitting}
                  >
                    Send Message
                  </Button>
                </Grid>
              </FormControl>
            </form>
          </GridItem>
        </Grid>
      </Box>
      <Box pt={20}>
        <Footer />
      </Box>
    </Box>
  );
}
