import { Box, Heading, Accordion, AccordionItem, AccordionButton, AccordionPanel, Text } from '@chakra-ui/react';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';
import NavBar from '@/components/Navbar';
import Head from 'next/head'
import Footer from '../../components/Footer'


const faqItems = [
  {
    question: "What are your delivery options?",
    answer: "We offer same day delivery (1-3 hours) across Kampala. International shipping available for select items."
  },
  {
    question: "How do I track my order?",
    answer: "You'll receive a tracking number via email once your order ships. Use our order tracking page or the carrier's website to monitor your package."
  },
  {
    question: "Do you offer international shipping?",
    answer: "Yes, we ship to over 50 countries. Shipping costs and delivery times vary depending on destination."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards and Mobile Money (MTN and Airtel)."
  }
];

export default function FAQPage() {
  return (
    <Box  bg='#fcd7d7' minH={'100vh'}>
        <Head>
          <title>FAQs | Little Kobe Japanese Market</title>
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
        minH={'90vh'}
      >
        <Heading as="h1" size="lg" mb={8} fontFamily="logoFont">
          Frequently Asked Questions
        </Heading>
        
        <Accordion allowToggle>
          {faqItems.map((item, index) => (
            <AccordionItem 
              key={index} 
              borderColor="black"
              mb={4}
              _hover={{ borderColor: 'brand.red' }}
            >
              {({ isExpanded }) => (
                <>
                  <AccordionButton 
                    _hover={{ bg: 'brand.beige' }}
                    py={4}
                  >
                    <Box flex="1" textAlign="left">
                      <Text fontSize="lg" fontWeight="bold" fontFamily="nbText">{item.question}</Text>
                    </Box>
                    {isExpanded ? (
                      <MinusIcon fontSize="12px" />
                    ) : (
                      <AddIcon fontSize="12px" />
                    )}
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <Text color="brand.darkRed" fontFamily="nbText">{item.answer}</Text>
                  </AccordionPanel>
                </>
              )}
            </AccordionItem>
          ))}
        </Accordion>
      </Box>

      <Footer />
    </Box>
  );
}
