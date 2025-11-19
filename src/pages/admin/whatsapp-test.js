import { useCallback, useEffect, useState } from 'react';
import {
    Box,
    Button,
    Container,
    Divider,
    FormControl,
    FormLabel,
    Heading,
    Input,
    Stack,
    Switch,
    Text,
    useToast,
    Code
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import AdminNavbar from '@/components/admin/AdminNavbar';

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const MAP_CONTAINER_STYLE = {
    width: '100%',
    height: '320px',
    borderRadius: 'lg',
};
const KAMPALA_CENTER = {
    lat: 0.347596,
    lng: 32.58252,
};

function WhatsAppTestPage() {
    const toast = useToast();
    const [recipient, setRecipient] = useState('');
    const [isShopkeeper, setIsShopkeeper] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiResponse, setApiResponse] = useState(null);

    const [deliveryRecipient, setDeliveryRecipient] = useState('');
    const [deliveryIsShopkeeper, setDeliveryIsShopkeeper] = useState(false);
    const [deliveryLat, setDeliveryLat] = useState('');
    const [deliveryLng, setDeliveryLng] = useState('');
    const [deliveryLocationText, setDeliveryLocationText] = useState('');
    const [deliveryArrivalWindow, setDeliveryArrivalWindow] = useState('');
    const [isDeliverySubmitting, setIsDeliverySubmitting] = useState(false);
    const [deliveryApiResponse, setDeliveryApiResponse] = useState(null);
    const [deliveryAddressQuery, setDeliveryAddressQuery] = useState('');
    const [deliveryMap, setDeliveryMap] = useState(null);
    const [selectedDeliveryPosition, setSelectedDeliveryPosition] = useState(null);
    const [isDeliveryGeocoding, setIsDeliveryGeocoding] = useState(false);
    const [deliveryGeocodeError, setDeliveryGeocodeError] = useState('');

    const { isLoaded: isDeliveryMapLoaded, loadError: deliveryMapLoadError } = useJsApiLoader({
        id: 'admin-whatsapp-map',
        googleMapsApiKey: MAPS_API_KEY || '',
    });

    useEffect(() => {
        const lat = parseFloat(deliveryLat);
        const lng = parseFloat(deliveryLng);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
            setSelectedDeliveryPosition({ lat, lng });
        } else if (!deliveryLat && !deliveryLng) {
            setSelectedDeliveryPosition(null);
        }
    }, [deliveryLat, deliveryLng]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!recipient.trim()) {
            toast({
                title: 'Recipient required',
                description: 'Enter an E.164 formatted phone number (e.g. +256…)',
                status: 'warning',
                duration: 4000,
                isClosable: true,
                position: 'top'
            });
            return;
        }

        try {
            setIsSubmitting(true);
            setApiResponse(null);

            const params = new URLSearchParams({
                test: 'true',
                testRecipient: recipient.trim(),
                isShopkeeperTest: String(isShopkeeper)
            });

            const response = await fetch(`/api/whatsapp/send-order-confirmation?${params.toString()}`);
            const data = await response.json().catch(() => ({ message: 'No JSON payload returned' }));
            setApiResponse({ status: response.status, data });

            if (response.ok) {
                toast({
                    title: 'Test request sent',
                    description: 'Check the device for the WhatsApp template message.',
                    status: 'success',
                    duration: 5000,
                    isClosable: true,
                    position: 'top'
                });
            } else {
                toast({
                    title: 'WhatsApp API returned an error',
                    description: data?.message || 'See details below.',
                    status: 'error',
                    duration: 6000,
                    isClosable: true,
                    position: 'top'
                });
            }
        } catch (error) {
            console.error('Failed to hit WhatsApp test endpoint:', error);
            setApiResponse({ status: 'network-error', data: { message: error.message } });
            toast({
                title: 'Request failed',
                description: error.message,
                status: 'error',
                duration: 6000,
                isClosable: true,
                position: 'top'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeliveryMapLoad = useCallback((mapInstance) => setDeliveryMap(mapInstance), []);
    const handleDeliveryMapUnmount = useCallback(() => setDeliveryMap(null), []);

    const applyDeliveryPosition = useCallback((lat, lng) => {
        setSelectedDeliveryPosition({ lat, lng });
        setDeliveryLat(lat.toString());
        setDeliveryLng(lng.toString());
        if (deliveryMap) {
            deliveryMap.panTo({ lat, lng });
            deliveryMap.setZoom(16);
        }
    }, [deliveryMap]);

    const handleDeliveryMapClick = useCallback((event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        applyDeliveryPosition(lat, lng);
        setDeliveryGeocodeError('');
    }, [applyDeliveryPosition]);

    const geocodeDeliveryAddress = useCallback((addressString) => {
        if (!addressString.trim()) {
            setDeliveryGeocodeError('Enter an address to search.');
            return;
        }
        if (!isDeliveryMapLoaded || !MAPS_API_KEY) {
            setDeliveryGeocodeError('Maps not ready yet.');
            return;
        }
        if (typeof window === 'undefined' || !window.google?.maps?.Geocoder) {
            setDeliveryGeocodeError('Google Maps geocoder unavailable.');
            return;
        }

        setIsDeliveryGeocoding(true);
        setDeliveryGeocodeError('');

        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: addressString, componentRestrictions: { country: 'UG' } }, (results, status) => {
            setIsDeliveryGeocoding(false);
            if (status === 'OK' && results?.[0]) {
                const location = results[0].geometry.location;
                applyDeliveryPosition(location.lat(), location.lng());
            } else {
                setDeliveryGeocodeError(`Could not find "${addressString}". Try dropping a pin.`);
            }
        });
    }, [applyDeliveryPosition, isDeliveryMapLoaded]);

    const handleDeliveryAddressSearch = useCallback(() => {
        geocodeDeliveryAddress(deliveryAddressQuery);
    }, [deliveryAddressQuery, geocodeDeliveryAddress]);

    const handleDeliveryAddressKeyDown = useCallback((event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleDeliveryAddressSearch();
        }
    }, [handleDeliveryAddressSearch]);

    const handleDeliverySubmit = async (event) => {
        event.preventDefault();
        if (!deliveryRecipient.trim()) {
            toast({
                title: 'Recipient required',
                description: 'Enter an E.164 formatted phone number (e.g. +256…)',
                status: 'warning',
                duration: 4000,
                isClosable: true,
                position: 'top'
            });
            return;
        }

        try {
            setIsDeliverySubmitting(true);
            setDeliveryApiResponse(null);

            const params = new URLSearchParams({
                test: 'true',
                testRecipient: deliveryRecipient.trim(),
                isShopkeeperTest: String(deliveryIsShopkeeper)
            });

            if (deliveryLat.trim()) params.set('lat', deliveryLat.trim());
            if (deliveryLng.trim()) params.set('lng', deliveryLng.trim());
            if (deliveryLocationText.trim()) params.set('locationText', deliveryLocationText.trim());
            if (deliveryArrivalWindow.trim()) params.set('arrivalWindow', deliveryArrivalWindow.trim());

            const response = await fetch(`/api/whatsapp/send-delivery-location-confirmation?${params.toString()}`);
            const data = await response.json().catch(() => ({ message: 'No JSON payload returned' }));
            setDeliveryApiResponse({ status: response.status, data });

            if (response.ok) {
                toast({
                    title: 'Delivery location test sent',
                    description: 'Check the device for the WhatsApp delivery location template.',
                    status: 'success',
                    duration: 5000,
                    isClosable: true,
                    position: 'top'
                });
            } else {
                toast({
                    title: 'Delivery location API returned an error',
                    description: data?.message || 'See details below.',
                    status: 'error',
                    duration: 6000,
                    isClosable: true,
                    position: 'top'
                });
            }
        } catch (error) {
            console.error('Failed to hit WhatsApp delivery location test endpoint:', error);
            setDeliveryApiResponse({ status: 'network-error', data: { message: error.message } });
            toast({
                title: 'Request failed',
                description: error.message,
                status: 'error',
                duration: 6000,
                isClosable: true,
                position: 'top'
            });
        } finally {
            setIsDeliverySubmitting(false);
        }
    };

    return (
        <>
        <AdminNavbar />
        <Container maxW="lg" py={12}>
            <Stack spacing={6}>
                <Heading as="h1" size="lg">WhatsApp Template Test</Heading>

                <Box>
                    <Heading as="h2" size="md" mb={2}>Order confirmation template</Heading>
                    <Text color="gray.600">
                        Trigger the `/api/whatsapp/send-order-confirmation` endpoint in test mode.
                        Provide a verified WhatsApp number to receive the canned order template.
                    </Text>
                </Box>
                <Box as="form" onSubmit={handleSubmit} p={6} borderWidth="1px" borderRadius="lg" boxShadow="sm">
                    <Stack spacing={4}>
                        <FormControl>
                            <FormLabel>Recipient phone number</FormLabel>
                            <Input
                                placeholder="+256700000000"
                                value={recipient}
                                onChange={(event) => setRecipient(event.target.value)}
                                autoComplete="tel"
                            />
                        </FormControl>
                        <FormControl display="flex" alignItems="center">
                            <FormLabel htmlFor="shopkeeper-switch" mb="0">
                                Send shopkeeper variant
                            </FormLabel>
                            <Switch
                                id="shopkeeper-switch"
                                isChecked={isShopkeeper}
                                onChange={(event) => setIsShopkeeper(event.target.checked)}
                            />
                        </FormControl>
                        <Button
                            type="submit"
                            colorScheme="teal"
                            isLoading={isSubmitting}
                            loadingText="Sending"
                        >
                            Send test message
                        </Button>
                    </Stack>
                </Box>

                <Divider />

                <Box>
                    <Heading as="h2" size="md" mb={2}>Latest response</Heading>
                    {apiResponse ? (
                        <Box p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
                            <Text fontWeight="semibold">Status: {apiResponse.status}</Text>
                            <Code display="block" whiteSpace="pre" mt={2} p={2} w="full">
                                {JSON.stringify(apiResponse.data, null, 2)}
                            </Code>
                        </Box>
                    ) : (
                        <Text color="gray.500">Run a test to see Meta API responses and errors here.</Text>
                    )}
                </Box>

                <Divider />

                <Box>
                    <Heading as="h2" size="md" mb={2}>Delivery location template</Heading>
                    <Text color="gray.600">
                        Trigger `/api/whatsapp/send-delivery-location-confirmation` test mode with optional coordinates.
                        Leave latitude/longitude empty to use the API defaults.
                    </Text>
                </Box>
                <Box as="form" onSubmit={handleDeliverySubmit} p={6} borderWidth="1px" borderRadius="lg" boxShadow="sm">
                    <Stack spacing={4}>
                        <FormControl>
                            <FormLabel>Search delivery area</FormLabel>
                            <Stack direction={{ base: 'column', sm: 'row' }} spacing={3}>
                                <Input
                                    placeholder="e.g., Plot 123, Nakasero Road"
                                    value={deliveryAddressQuery}
                                    onChange={(event) => setDeliveryAddressQuery(event.target.value)}
                                    onKeyDown={handleDeliveryAddressKeyDown}
                                />
                                <Button
                                    onClick={handleDeliveryAddressSearch}
                                    leftIcon={<SearchIcon />}
                                    colorScheme="teal"
                                    variant="outline"
                                    isLoading={isDeliveryGeocoding}
                                >
                                    Search
                                </Button>
                            </Stack>
                            {deliveryGeocodeError && (
                                <Text mt={2} color="red.500" fontSize="sm">
                                    {deliveryGeocodeError}
                                </Text>
                            )}
                        </FormControl>
                        <Box>
                            <Text fontWeight="semibold" mb={2}>
                                Drop a pin to auto-fill coordinates
                            </Text>
                            {MAPS_API_KEY ? (
                                isDeliveryMapLoaded && !deliveryMapLoadError ? (
                                    <Box borderWidth="1px" borderRadius="lg" overflow="hidden">
                                        <GoogleMap
                                            mapContainerStyle={MAP_CONTAINER_STYLE}
                                            center={selectedDeliveryPosition || KAMPALA_CENTER}
                                            zoom={selectedDeliveryPosition ? 15 : 12}
                                            onLoad={handleDeliveryMapLoad}
                                            onUnmount={handleDeliveryMapUnmount}
                                            onClick={handleDeliveryMapClick}
                                        >
                                            {selectedDeliveryPosition && (
                                                <Marker position={selectedDeliveryPosition} />
                                            )}
                                        </GoogleMap>
                                    </Box>
                                ) : (
                                    <Text color="gray.600" fontSize="sm">
                                        {deliveryMapLoadError ? 'Map failed to load.' : 'Loading map…'}
                                    </Text>
                                )
                            ) : (
                                <Text color="orange.600" fontSize="sm">
                                    Provide `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to enable the map tools.
                                </Text>
                            )}
                            <Text fontSize="sm" color="gray.600" mt={2}>
                                Clicking the map updates the latitude/longitude fields below.
                            </Text>
                        </Box>
                        <FormControl>
                            <FormLabel>Recipient phone number</FormLabel>
                            <Input
                                placeholder="+256700000000"
                                value={deliveryRecipient}
                                onChange={(event) => setDeliveryRecipient(event.target.value)}
                                autoComplete="tel"
                            />
                        </FormControl>
                        <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
                            <FormControl>
                                <FormLabel>Latitude (optional)</FormLabel>
                                <Input
                                    placeholder="1.2921"
                                    value={deliveryLat}
                                    onChange={(event) => setDeliveryLat(event.target.value)}
                                    inputMode="decimal"
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Longitude (optional)</FormLabel>
                                <Input
                                    placeholder="36.8219"
                                    value={deliveryLng}
                                    onChange={(event) => setDeliveryLng(event.target.value)}
                                    inputMode="decimal"
                                />
                            </FormControl>
                        </Stack>
                        <FormControl>
                            <FormLabel>Location text (optional)</FormLabel>
                            <Input
                                placeholder="Test Address, Nairobi"
                                value={deliveryLocationText}
                                onChange={(event) => setDeliveryLocationText(event.target.value)}
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel>Arrival window (optional)</FormLabel>
                            <Input
                                placeholder="hour"
                                value={deliveryArrivalWindow}
                                onChange={(event) => setDeliveryArrivalWindow(event.target.value)}
                            />
                        </FormControl>
                        <FormControl display="flex" alignItems="center">
                            <FormLabel htmlFor="delivery-shopkeeper-switch" mb="0">
                                Send shopkeeper variant
                            </FormLabel>
                            <Switch
                                id="delivery-shopkeeper-switch"
                                isChecked={deliveryIsShopkeeper}
                                onChange={(event) => setDeliveryIsShopkeeper(event.target.checked)}
                            />
                        </FormControl>
                        <Button
                            type="submit"
                            colorScheme="purple"
                            isLoading={isDeliverySubmitting}
                            loadingText="Sending"
                        >
                            Send delivery location test
                        </Button>
                    </Stack>
                </Box>
                <Box>
                    <Heading as="h2" size="md" mb={2}>Delivery template response</Heading>
                    {deliveryApiResponse ? (
                        <Box p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
                            <Text fontWeight="semibold">Status: {deliveryApiResponse.status}</Text>
                            <Code display="block" whiteSpace="pre" mt={2} p={2} w="full">
                                {JSON.stringify(deliveryApiResponse.data, null, 2)}
                            </Code>
                        </Box>
                    ) : (
                        <Text color="gray.500">Run a delivery template test to inspect the API response.</Text>
                    )}
                </Box>
            </Stack>
        </Container>
        </>
    );
}

export default WhatsAppTestPage;
