import {
  Box,
  Heading,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Divider,
  Flex,
  Spinner,
  Center,
} from '@chakra-ui/react';
import NavBar from '@/components/Navbar';
import Head from 'next/head';
import Footer from '../../components/Footer';
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';

export default function SuccessPage() {
  const router = useRouter();
  const { ref } = router.query;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef();

  useEffect(() => {
    if (!router.isReady || !ref) return;

    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/by-ref?ref=${encodeURIComponent(ref)}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setOrder(data.order);
      } catch {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [router.isReady, ref]);

  const handleDownloadPDF = () => {
    window.print();
  };

  const items = order?.cart_items || [];
  const delivery = order?.delivery_address || {};
  const total = order?.amount;
  const currency = order?.currency || 'UGX';
  const customerName = [delivery.first_name, delivery.last_name].filter(Boolean).join(' ') || 'Customer';

  return (
    <Box bg='#fcd7d7'>
      <Head>
        <title>Order Success - Thanks for your Order | Little Kobe Japanese Market</title>
        <meta name="description" content="Little Kobe Japanese Market" />
        <meta property="og:title" content='Little Kobe Japanese Market' />
        <meta property="og:description" content="Little Kobe Japanese Market" />
        <meta property="og:image" content="https://cdn.sanity.io/images/is2g99zr/production/81fd32be832c6541d2b259c9caef38041e0e5b04-120x120.png" />
        <meta property="og:image:secure_url" content="https://cdn.sanity.io/images/is2g99zr/production/81fd32be832c6541d2b259c9caef38041e0e5b04-120x120.png" />
        <meta property="og:image:width" content="120" />
        <meta property="og:image:height" content="120" />
        <meta property="og:type" content="website" />
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #order-receipt, #order-receipt * { visibility: visible; }
            #order-receipt {
              position: fixed;
              top: 0; left: 0;
              width: 100%;
              background: white !important;
              padding: 32px;
            }
          }
        `}</style>
      </Head>

      <NavBar />

      <Box
        maxW="800px"
        mx="auto"
        px={{ base: 8, md: 8 }}
        py={{ base: 12, lg: 20 }}
        color="black"
        minH={'100vh'}
      >
        <Heading as="h1" size="2xl" mb={6} fontFamily="nbHeading">
          Order Confirmed!
        </Heading>

        <Text fontFamily="nbText" fontSize={{ base: 'lg', md: 'xl' }} mb={2}>
          Thanks for your order{customerName && customerName !== 'Customer' ? `, ${customerName}` : ''}! We have sent you an email and a WhatsApp message with the details.
        </Text>

        <Text fontFamily="nbText" fontSize={{ base: 'md', md: 'lg' }} mb={2} color="gray.700">
          It should take one hour to process and dispatch.
        </Text>

        <Text fontFamily="nbText" fontSize={{ base: 'md', md: 'lg' }} mb={8} color="gray.700">
          You will be messaged and/or called before the order is dispatched.
        </Text>

        {loading ? (
          <Center py={10}>
            <Spinner size="lg" />
          </Center>
        ) : order ? (
          <Box
            id="order-receipt"
            bg="white"
            borderColor="black"
            borderWidth="2px"
            borderRadius="lg"
            boxShadow="4px 4px 0px 0px rgba(0, 0, 0, 1)"
            p={6}
            mb={6}
            ref={printRef}
          >
            <Heading as="h2" fontFamily="nbHeading" fontSize="xl" mb={4}>
              Order Summary
            </Heading>

            {ref && (
              <Text fontFamily="nbText" fontSize="sm" color="gray.500" mb={4}>
                Reference: {ref}
              </Text>
            )}

            <Table variant="simple" size="sm" mb={4}>
              <Thead bg="gray.50">
                <Tr>
                  <Th fontFamily="nbHeading" borderColor="gray.300">Item</Th>
                  <Th fontFamily="nbHeading" borderColor="gray.300" isNumeric>Qty</Th>
                  <Th fontFamily="nbHeading" borderColor="gray.300" isNumeric>Unit Price</Th>
                  <Th fontFamily="nbHeading" borderColor="gray.300" isNumeric>Subtotal</Th>
                </Tr>
              </Thead>
              <Tbody>
                {items.map((item, i) => (
                  <Tr key={item._id || i}>
                    <Td fontFamily="nbText" borderColor="gray.200">{item.name}</Td>
                    <Td fontFamily="nbText" borderColor="gray.200" isNumeric>{item.quantity}</Td>
                    <Td fontFamily="nbText" borderColor="gray.200" isNumeric>
                      {Number(item.price).toLocaleString()} {currency}
                    </Td>
                    <Td fontFamily="nbText" borderColor="gray.200" isNumeric>
                      {(Number(item.price) * item.quantity).toLocaleString()} {currency}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>

            <Divider borderColor="black" mb={3} />

            <Flex justify="flex-end" mb={6}>
              <Text fontFamily="nbHeading" fontSize="lg">
                Total: {Number(total).toLocaleString()} {currency}
              </Text>
            </Flex>

            {(delivery.line_1 || delivery.email_address || delivery.phone_number) && (
              <>
                <Heading as="h3" fontFamily="nbHeading" fontSize="md" mb={3}>
                  Delivery Details
                </Heading>
                <Table variant="simple" size="sm">
                  <Tbody>
                    {customerName && customerName !== 'Customer' && (
                      <Tr>
                        <Td fontFamily="nbHeading" borderColor="gray.200" w="40%">Name</Td>
                        <Td fontFamily="nbText" borderColor="gray.200">{customerName}</Td>
                      </Tr>
                    )}
                    {delivery.line_1 && (
                      <Tr>
                        <Td fontFamily="nbHeading" borderColor="gray.200">Address</Td>
                        <Td fontFamily="nbText" borderColor="gray.200">{delivery.line_1}</Td>
                      </Tr>
                    )}
                    {(order.customer_email || delivery.email_address) && (
                      <Tr>
                        <Td fontFamily="nbHeading" borderColor="gray.200">Email</Td>
                        <Td fontFamily="nbText" borderColor="gray.200">{order.customer_email || delivery.email_address}</Td>
                      </Tr>
                    )}
                    {(order.customer_phone || delivery.phone_number) && (
                      <Tr>
                        <Td fontFamily="nbHeading" borderColor="gray.200">Phone</Td>
                        <Td fontFamily="nbText" borderColor="gray.200">{order.customer_phone || delivery.phone_number}</Td>
                      </Tr>
                    )}
                  </Tbody>
                </Table>
              </>
            )}
          </Box>
        ) : null}

        <Flex gap={4} flexWrap="wrap">
          <Button
            as='a'
            href='/'
            textColor={'black'}
            borderColor="black"
            borderWidth={'2px'}
            borderRadius="lg"
            boxShadow="2px 2px 0px 0px rgba(0, 0, 0, 1)"
            _hover={{ transform: 'translateY(-2px)', boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
            transition="all 0.15s ease"
          >
            Back Home
          </Button>

          {order && (
            <Button
              onClick={handleDownloadPDF}
              textColor={'black'}
              bg="white"
              borderColor="black"
              borderWidth={'2px'}
              borderRadius="lg"
              boxShadow="2px 2px 0px 0px rgba(0, 0, 0, 1)"
              _hover={{ transform: 'translateY(-2px)', boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
              transition="all 0.15s ease"
            >
              Download as PDF
            </Button>
          )}
        </Flex>
      </Box>

      <Footer />
    </Box>
  );
}
