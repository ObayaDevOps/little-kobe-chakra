import React, { useState, useEffect } from 'react';
import {
    Box,
    Heading,
    Input,
    Button,
    FormControl,
    FormLabel,
    HStack,
    VStack,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Image,
    Spinner,
    Text,
    Alert,
    AlertIcon,
    Flex,
    Link,
    useToast,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
} from '@chakra-ui/react';
import { SearchIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';

function AdminInventoryPage() {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [updatingItems, setUpdatingItems] = useState({});
    const toast = useToast();

    const [originalInventory, setOriginalInventory] = useState([]);

    const fetchData = async (query = '') => {
        setLoading(true);
        setError(null);
        setUpdatingItems({});
        try {
            const response = await fetch(`/api/admin/inventory${query ? `?search=${encodeURIComponent(query)}` : ''}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setInventory(data);
            setOriginalInventory(JSON.parse(JSON.stringify(data)));
        } catch (e) {
            console.error("Failed to fetch inventory:", e);
            setError(e.message);
            setInventory([]);
            setOriginalInventory([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSearch = (event) => {
        event.preventDefault();
        fetchData(searchTerm);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        fetchData('');
    };

    const handleInputChange = (sanityId, field, value) => {
        setInventory(prevInventory =>
            prevInventory.map(item =>
                item.sanityId === sanityId ? { ...item, [field]: value } : item
            )
        );
    };

    const handlePublish = async (sanityId) => {
        const itemToUpdate = inventory.find(item => item.sanityId === sanityId);
        if (!itemToUpdate) return;

        setUpdatingItems(prev => ({ ...prev, [sanityId]: true }));

        try {
            const response = await fetch('/api/admin/inventory/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sanityId: itemToUpdate.sanityId,
                    price: itemToUpdate.price,
                    quantity: itemToUpdate.quantity,
                    minStockLevel: itemToUpdate.minStockLevel,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `HTTP error! status: ${response.status}`);
            }

            setOriginalInventory(prevOriginal =>
                prevOriginal.map(item =>
                    item.sanityId === sanityId ? { ...itemToUpdate } : item
                )
            );

            toast({
                title: 'Success',
                description: `Item ${itemToUpdate.name || sanityId} updated successfully.`,
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

        } catch (e) {
            console.error("Failed to update inventory:", e);
            setInventory(prevInventory =>
                prevInventory.map(item => {
                    if (item.sanityId === sanityId) {
                        const originalItem = originalInventory.find(orig => orig.sanityId === sanityId);
                        return originalItem || item;
                    }
                    return item;
                })
            );
            toast({
                title: 'Update Failed',
                description: e.message || 'Could not update item.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setUpdatingItems(prev => ({ ...prev, [sanityId]: false }));
        }
    };

    const hasChanges = (sanityId) => {
        const currentItem = inventory.find(item => item.sanityId === sanityId);
        const originalItem = originalInventory.find(item => item.sanityId === sanityId);
        if (!currentItem || !originalItem) return false;

        return String(currentItem.price ?? '') !== String(originalItem.price ?? '') ||
               String(currentItem.quantity ?? '') !== String(originalItem.quantity ?? '') ||
               String(currentItem.minStockLevel ?? '') !== String(originalItem.minStockLevel ?? '');
    };

    return (
        <Box p={5}>
            <Heading mb={2}>Admin Inventory Management</Heading>
            <Text mb={2}>A Dashboard showing Current Price, Inventory and Sales Information</Text>
            <Text mb={2}>Make edits and publish and the prices will be reflected on the website</Text>
            <Text mb={6}>To add Products, edit Product Info or Pictures, please use <Link href="/studio" isExternal color="teal.500">Sanity Studio</Link></Text>

            <form onSubmit={handleSearch}>
                <HStack mb={6} spacing={4}>
                    <FormControl flex="1">
                        <Input
                            id="search"
                            placeholder="Search by name or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </FormControl>
                    <Button type="submit" leftIcon={<SearchIcon />} colorScheme="teal">
                        Search
                    </Button>
                    <Button type="button" onClick={handleClearSearch} variant="outline">
                        Clear
                    </Button>
                </HStack>
             </form>

            {loading && (
                <Flex justify="center" align="center" height="200px">
                    <Spinner size="xl" />
                    <Text ml={3}>Loading inventory...</Text>
                </Flex>
            )}

            {error && (
                <Alert status="error" mb={6}>
                    <AlertIcon />
                    Error fetching inventory: {error}
                </Alert>
            )}

            {!loading && !error && (
                <>
                    <Table variant="simple" size="md">
                        <Thead>
                            <Tr>
                                <Th>Image</Th>
                                <Th>Name</Th>
                                <Th isNumeric>Price (UGX)</Th>
                                <Th isNumeric>Quantity</Th>
                                <Th isNumeric>Min Stock</Th>
                                <Th>In Sync</Th>
                                <Th>Actions</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {inventory.map((item) => {
                                const isUpdating = updatingItems[item.sanityId];
                                const changed = hasChanges(item.sanityId);

                                return (
                                <Tr key={item.sanityId} bg={changed ? 'yellow.50' : 'inherit'}>
                                    <Td>
                                        {item.imageUrl ? (
                                            <Image
                                                src={item.imageUrl}
                                                alt={item.name}
                                                boxSize="50px"
                                                objectFit="cover"
                                                borderRadius="md"
                                            />
                                        ) : <Text>-</Text>}
                                    </Td>
                                    <Td>{item.name ?? 'N/A'}</Td>
                                    <Td isNumeric>
                                         <NumberInput
                                            size="sm"
                                            value={item.price ?? ''}
                                            onChange={(valueAsString, valueAsNumber) => handleInputChange(item.sanityId, 'price', valueAsString)}
                                            min={0}
                                            isDisabled={isUpdating}
                                        >
                                            <NumberInputField />
                                        </NumberInput>
                                    </Td>
                                     <Td isNumeric>
                                         <NumberInput
                                            size="sm"
                                            value={item.quantity ?? ''}
                                            onChange={(valueAsString, valueAsNumber) => handleInputChange(item.sanityId, 'quantity', valueAsString)}
                                            min={0}
                                             precision={0}
                                             isDisabled={isUpdating}
                                        >
                                            <NumberInputField />
                                            <NumberInputStepper>
                                                <NumberIncrementStepper />
                                                <NumberDecrementStepper />
                                            </NumberInputStepper>
                                        </NumberInput>
                                    </Td>
                                    <Td isNumeric>
                                         <NumberInput
                                            size="sm"
                                            value={item.minStockLevel ?? ''}
                                            onChange={(valueAsString, valueAsNumber) => handleInputChange(item.sanityId, 'minStockLevel', valueAsString)}
                                            min={0}
                                            precision={0}
                                            isDisabled={isUpdating}
                                        >
                                            <NumberInputField />
                                             <NumberInputStepper>
                                                <NumberIncrementStepper />
                                                <NumberDecrementStepper />
                                            </NumberInputStepper>
                                        </NumberInput>
                                    </Td>
                                    <Td>{item.isInInventory ? 'Yes' : 'No'}</Td>
                                    <Td>
                                        <VStack spacing={2} align="stretch">
                                            <Button
                                                size="sm"
                                                colorScheme="green"
                                                onClick={() => handlePublish(item.sanityId)}
                                                isLoading={isUpdating}
                                                isDisabled={isUpdating || !changed}
                                                leftIcon={<CheckIcon />}
                                                w="100%"
                                            >
                                                Publish Changes
                                            </Button>
                                            <Link
                                                href={`/studio/desk/product;${item.sanityId}`}
                                                isExternal={false}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ width: '100%' }}
                                            >
                                                <Button size="sm" colorScheme="blue" w="100%" isDisabled={isUpdating}>
                                                    Edit Details (Sanity)
                                                </Button>
                                            </Link>
                                        </VStack>
                                    </Td>
                                </Tr>
                                );
                             })}
                        </Tbody>
                    </Table>
                    {inventory.length === 0 && !loading && (
                        <Text mt={4} textAlign="center">No inventory items found matching your search criteria.</Text>
                    )}
                </>
            )}
        </Box>
    );
}

export default AdminInventoryPage;

// Optional: Add getServerSideProps or getStaticProps if needed for initial data fetching
// But client-side fetching as shown is often fine for admin dashboards 