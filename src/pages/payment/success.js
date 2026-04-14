import {
  Box,
  Heading,
  Text,
  Button,
  Divider,
  Flex,
  Stack,
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

            {/* Column headers — hidden on mobile */}
            <Flex
              display={{ base: 'none', md: 'flex' }}
              justify="space-between"
              px={2}
              pb={2}
              borderBottomWidth="1px"
              borderColor="gray.300"
              mb={1}
            >
              <Text fontFamily="nbHeading" fontSize="xs" color="gray.500" flex="1">ITEM</Text>
              <Text fontFamily="nbHeading" fontSize="xs" color="gray.500" w="40px" textAlign="center">QTY</Text>
              <Text fontFamily="nbHeading" fontSize="xs" color="gray.500" w="120px" textAlign="right">UNIT PRICE</Text>
              <Text fontFamily="nbHeading" fontSize="xs" color="gray.500" w="100px" textAlign="right">SUBTOTAL</Text>
            </Flex>

            <Stack spacing={0} mb={4}>
              {items.map((item, i) => (
                <Box
                  key={item._id || i}
                  borderBottomWidth="1px"
                  borderColor="gray.200"
                  py={3}
                  px={2}
                >
                  {/* Mobile: stacked layout */}
                  <Box display={{ base: 'block', md: 'none' }}>
                    <Text fontFamily="nbText" fontSize="sm" fontWeight="medium" mb={1}>
                      {item.name}
                    </Text>
                    <Flex justify="space-between">
                      <Text fontFamily="nbText" fontSize="sm" color="gray.500">
                        Qty: {item.quantity} × {Number(item.price).toLocaleString()} {currency}
                      </Text>
                      <Text fontFamily="nbHeading" fontSize="sm">
                        {(Number(item.price) * item.quantity).toLocaleString()} {currency}
                      </Text>
                    </Flex>
                  </Box>

                  {/* Desktop: single-row layout */}
                  <Flex display={{ base: 'none', md: 'flex' }} justify="space-between" align="center">
                    <Text fontFamily="nbText" fontSize="sm" flex="1">{item.name}</Text>
                    <Text fontFamily="nbText" fontSize="sm" w="40px" textAlign="center">{item.quantity}</Text>
                    <Text fontFamily="nbText" fontSize="sm" w="120px" textAlign="right">
                      {Number(item.price).toLocaleString()} {currency}
                    </Text>
                    <Text fontFamily="nbText" fontSize="sm" w="100px" textAlign="right">
                      {(Number(item.price) * item.quantity).toLocaleString()} {currency}
                    </Text>
                  </Flex>
                </Box>
              ))}
            </Stack>

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
                <Stack spacing={2}>
                  {[
                    customerName && customerName !== 'Customer' && { label: 'Name', value: customerName },
                    delivery.line_1 && { label: 'Address', value: delivery.line_1 },
                    (order.customer_email || delivery.email_address) && { label: 'Email', value: order.customer_email || delivery.email_address },
                    (order.customer_phone || delivery.phone_number) && { label: 'Phone', value: order.customer_phone || delivery.phone_number },
                  ].filter(Boolean).map(({ label, value }) => (
                    <Flex key={label} gap={3} borderBottomWidth="1px" borderColor="gray.100" pb={2} flexWrap="wrap">
                      <Text fontFamily="nbHeading" fontSize="sm" minW="70px" color="gray.600">{label}</Text>
                      <Text fontFamily="nbText" fontSize="sm" flex="1" wordBreak="break-word">{value}</Text>
                    </Flex>
                  ))}
                </Stack>
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
