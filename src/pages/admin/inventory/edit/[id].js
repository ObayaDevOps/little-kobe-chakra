import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
    Box,
    Heading,
    FormControl,
    FormLabel,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Button,
    Spinner,
    Text,
    Alert,
    AlertIcon,
    VStack,
    useToast // For feedback
} from '@chakra-ui/react';
import Link from 'next/link'; // For back link

function EditInventoryItemPage() {
    const router = useRouter();
    const { id } = router.query; // Get the sanityId from the URL path

    const [item, setItem] = useState(null);
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [minStock, setMinStock] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const toast = useToast();

    // Fetch item details when the component mounts or ID changes
    useEffect(() => {
        if (id) {
            setLoading(true);
            setError(null);
            fetch(`/api/admin/inventory/${id}`) // Assumes API endpoint exists
                .then(res => {
                    if (!res.ok) {
                        // Check for specific error messages from API if available
                        return res.json().then(errData => {
                           throw new Error(errData.message || `Item not found or API error: ${res.status}`);
                        });
                    }
                    return res.json();
                })
                .then(data => {
                    setItem(data);
                    // Initialize form state only after data is successfully fetched
                    setPrice(data.price ?? '');
                    setQuantity(data.quantity ?? '');
                    setMinStock(data.minStockLevel ?? '');
                    setLoading(false);
                })
                .catch(e => {
                    console.error("Error fetching item:", e);
                    setError(e.message);
                    setLoading(false);
                    setItem(null); // Ensure item state is null on error
                });
        } else {
             setLoading(false); // Don't load if ID is not present yet
        }
    }, [id]); // Re-run effect if id changes

    // Handle form submission
    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSaving(true);
        setError(null);

        try {
            const response = await fetch(`/api/admin/inventory/${id}`, { // Assumes API endpoint exists
                method: 'PUT', // Or PATCH if only sending changed fields
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    // Send only the fields being edited
                    price: price === '' ? null : parseFloat(price), // Handle empty string for optional price
                    quantity: quantity === '' ? 0 : parseInt(quantity, 10), // Default empty quantity to 0
                    minStockLevel: minStock === '' ? null : parseInt(minStock, 10), // Handle empty string for optional minStock
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({})); // Try to parse JSON error, default to empty object
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            // Success!
            toast({
                title: "Item Updated",
                description: `${item?.name || 'Item'} price and stock updated successfully.`,
                status: "success",
                duration: 5000,
                isClosable: true,
                position: "top",
            });
            // Redirect back to the inventory list after successful save
             router.push('/admin/inventory');

        } catch (e) {
            console.error("Failed to update item:", e);
            setError(e.message); // Show specific error from API if possible
            toast({
                title: "Update Failed",
                description: e.message || "Could not update item details.",
                status: "error",
                duration: 9000,
                isClosable: true,
                 position: "top",
            });
        } finally {
            setIsSaving(false);
        }
    };

    // --- Render Logic ---

    if (loading) {
        return (
            <Box p={5} display="flex" justifyContent="center" alignItems="center" height="calc(100vh - 200px)">
                <Spinner size="xl" />
            </Box>
        );
    }

    // Error loading the item initially
    if (error && !item) {
        return (
             <Box p={5}>
                 <Alert status="error" mb={4}>
                    <AlertIcon />
                    Error loading item data: {error}
                </Alert>
                 <Link href="/admin/inventory" passHref>
                    <Button as="a">&larr; Back to Inventory</Button>
                 </Link>
             </Box>
        );
    }

     // Item not found after trying to load (e.g., invalid ID)
     if (!item) {
        return (
             <Box p={5}>
                 <Alert status="warning" mb={4}>
                    <AlertIcon />
                    Inventory item with ID '{id}' not found. It might not exist in the database yet.
                 </Alert>
                  <Link href="/admin/inventory" passHref>
                    <Button as="a">&larr; Back to Inventory</Button>
                 </Link>
             </Box>
        );
    }

    // Main form display
    return (
        <Box p={5} maxW="600px" mx="auto"> {/* Added max width and centered */}
            <Heading mb={2}>Edit: {item.name}</Heading>
             <Text mb={6} color="gray.600">Database ID: {item.id} (Sanity ID: {id})</Text> {/* Display both IDs if available */}

             <Link href="/admin/inventory" passHref>
                <Button mb={6} as="a" variant="outline" size="sm">
                    &larr; Back to Inventory List
                </Button>
             </Link>

            <form onSubmit={handleSubmit}>
                <VStack spacing={5} align="stretch"> {/* Increased spacing */}
                     {/* Display errors encountered during save attempts */}
                     {error && !isSaving && (
                        <Alert status="error" borderRadius="md">
                            <AlertIcon />
                            {error}
                        </Alert>
                    )}
                    <FormControl isRequired>
                        <FormLabel htmlFor="price">Price (UGX)</FormLabel>
                        <NumberInput
                            id="price"
                            value={price}
                            onChange={(valueString) => setPrice(valueString)}
                            min={0}
                            precision={0} // No decimals for UGX
                            allowMouseWheel // Allow changing value with mouse wheel
                        >
                            <NumberInputField />
                            {/* Removed stepper as it might be less useful for large prices */}
                        </NumberInput>
                    </FormControl>

                    <FormControl isRequired>
                        <FormLabel htmlFor="quantity">Quantity in Stock</FormLabel>
                        <NumberInput
                            id="quantity"
                            value={quantity}
                            onChange={(valueString) => setQuantity(valueString)}
                            min={0}
                            step={1}
                            allowMouseWheel
                         >
                            <NumberInputField />
                            <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                            </NumberInputStepper>
                        </NumberInput>
                    </FormControl>

                    <FormControl> {/* Made minStock optional */}
                        <FormLabel htmlFor="minStock">Minimum Stock Level (Optional)</FormLabel>
                        <NumberInput
                            id="minStock"
                            value={minStock}
                            onChange={(valueString) => setMinStock(valueString)}
                            min={0}
                            step={1}
                            allowMouseWheel
                        >
                            <NumberInputField placeholder="e.g., 5"/>
                             <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                            </NumberInputStepper>
                        </NumberInput>
                    </FormControl>

                    <Button
                        mt={4}
                        colorScheme="teal"
                        type="submit"
                        isLoading={isSaving}
                        loadingText="Saving..."
                        size="lg" // Made button larger
                    >
                        Save Changes
                    </Button>
                </VStack>
            </form>
        </Box>
    );
}

export default EditInventoryItemPage; 