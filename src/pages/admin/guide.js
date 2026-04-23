import Head from 'next/head';
import NextLink from 'next/link';
import AdminNavbar from '@/components/admin/AdminNavbar';
import {
    Box,
    Container,
    Heading,
    Text,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    OrderedList,
    UnorderedList,
    ListItem,
    Alert,
    AlertIcon,
    AlertDescription,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Badge,
    Button,
    Stack,
    Divider,
} from '@chakra-ui/react';

const sections = [
    'Getting Started',
    'Managing Your Products',
    'Adding a Brand New Product',
    'Archiving & Restoring a Product',
    'Low Stock Alerts',
    'Viewing Orders & Sales',
    'Changing Store Hours',
    'Quick Reference',
];

export default function GuidePage() {
    return (
        <>
            <Head>
                <title>How to Use | Little Kobe Admin</title>
            </Head>
            <AdminNavbar />
            <Container maxW="3xl" py={10}>
                <Stack spacing={6}>
                    <Box>
                        <Heading as="h1" size="lg" mb={2}>How to Use the Admin Panel</Heading>
                        <Text color="gray.600">
                            This guide walks you through everything you need to manage the Little Kobe store day-to-day.
                            No technical knowledge needed — just follow the steps.
                        </Text>
                    </Box>

                    {/* Quick jump links */}
                    <Box bg="gray.50" borderRadius="md" p={4} borderWidth="1px" borderColor="gray.200">
                        <Text fontWeight="semibold" mb={2}>Jump to a section:</Text>
                        <UnorderedList spacing={1} pl={2}>
                            {sections.map((s) => (
                                <ListItem key={s}>
                                    <Text
                                        as="a"
                                        href={`#${s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
                                        color="teal.600"
                                        _hover={{ textDecoration: 'underline' }}
                                    >
                                        {s}
                                    </Text>
                                </ListItem>
                            ))}
                        </UnorderedList>
                    </Box>

                    <Divider />

                    <Accordion allowMultiple defaultIndex={[0]}>

                        {/* ── 1. Getting Started ── */}
                        <AccordionItem border="none" mb={3}>
                            <AccordionButton
                                bg="teal.50"
                                borderRadius="md"
                                _hover={{ bg: 'teal.100' }}
                                px={4} py={3}
                            >
                                <Box id="getting-started" flex="1" textAlign="left">
                                    <Heading as="h2" size="md">1. Getting Started</Heading>
                                </Box>
                                <AccordionIcon />
                            </AccordionButton>
                            <AccordionPanel pb={4} pt={4} px={2}>
                                <Stack spacing={4}>
                                    <Text>
                                        When you log in to the admin area, you land on the <strong>Control Centre</strong> — think of it as your home base. From here you can access every tool you need.
                                    </Text>
                                    <Text>The four main tools are:</Text>
                                    <UnorderedList spacing={2} pl={4}>
                                        <ListItem><strong>Inventory Manager</strong> — update prices, stock levels, and hide/show products.</ListItem>
                                        <ListItem><strong>Orders &amp; Sales</strong> — see recent orders and which products are selling best.</ListItem>
                                        <ListItem><strong>Store Hours</strong> — set what time the shop opens and closes each day.</ListItem>
                                        <ListItem><strong>How to Use This System</strong> — this guide.</ListItem>
                                    </UnorderedList>
                                    <Text>
                                        You can also move between pages at any time using the navigation bar at the top of every page.
                                    </Text>
                                    <Alert status="info" borderRadius="md">
                                        <AlertIcon />
                                        <AlertDescription>
                                            The <strong>Technical Developer Tools</strong> section is for the web developer only. You do not need to use it for day-to-day shop management.
                                        </AlertDescription>
                                    </Alert>
                                </Stack>
                            </AccordionPanel>
                        </AccordionItem>

                        {/* ── 2. Managing Your Products ── */}
                        <AccordionItem border="none" mb={3}>
                            <AccordionButton
                                bg="teal.50"
                                borderRadius="md"
                                _hover={{ bg: 'teal.100' }}
                                px={4} py={3}
                            >
                                <Box id="managing-your-products" flex="1" textAlign="left">
                                    <Heading as="h2" size="md">2. Managing Your Products</Heading>
                                </Box>
                                <AccordionIcon />
                            </AccordionButton>
                            <AccordionPanel pb={4} pt={4} px={2}>
                                <Stack spacing={4}>
                                    <Text>
                                        The <strong>Inventory Manager</strong> is where you update prices and stock counts. Changes only go live on the website after you click <strong>Publish Changes</strong>.
                                    </Text>

                                    <Heading as="h3" size="sm">Finding a product</Heading>
                                    <OrderedList spacing={2} pl={4}>
                                        <ListItem>Go to <strong>Inventory Manager</strong> from the Control Centre.</ListItem>
                                        <ListItem>Type the product name in the search box and click <strong>Search</strong>, or scroll through the list.</ListItem>
                                        <ListItem>Click <strong>Clear</strong> to go back to the full list.</ListItem>
                                    </OrderedList>

                                    <Heading as="h3" size="sm">Updating price or stock</Heading>
                                    <OrderedList spacing={2} pl={4}>
                                        <ListItem>Find the product in the table.</ListItem>
                                        <ListItem>Click into the <strong>Price (UGX)</strong> box and type the new price.</ListItem>
                                        <ListItem>Click into the <strong>Quantity</strong> box and type how many you currently have in stock.</ListItem>
                                        <ListItem>Optionally, set a <strong>Min Stock</strong> number — this is the point at which you want to be reminded to restock (e.g. set to 5 if you want an alert when fewer than 5 remain).</ListItem>
                                        <ListItem>Click the <strong>Publish Changes</strong> button to save. The row will turn yellow while you have unsaved changes.</ListItem>
                                    </OrderedList>

                                    <Alert status="info" borderRadius="md">
                                        <AlertIcon />
                                        <AlertDescription>
                                            <strong>Publish Changes</strong> must be clicked for each product separately. Changes are not saved automatically.
                                        </AlertDescription>
                                    </Alert>

                                    <Heading as="h3" size="sm">Alert banners explained</Heading>
                                    <UnorderedList spacing={2} pl={4}>
                                        <ListItem>
                                            <Badge colorScheme="yellow" mr={1}>Yellow banner</Badge>
                                            <strong>Items Requiring Attention</strong> — these products are missing a price or stock number and will not appear on the website until they are filled in.
                                        </ListItem>
                                        <ListItem>
                                            <Badge colorScheme="red" mr={1}>Red banner</Badge>
                                            <strong>Low Stock Alert</strong> — these products have reached or gone below the minimum stock level you set. Time to reorder.
                                        </ListItem>
                                    </UnorderedList>

                                    <Heading as="h3" size="sm">What does "In Sync" mean?</Heading>
                                    <Text>
                                        The <strong>In Sync</strong> column shows <em>Yes</em> if the product has been set up in the stock system, or <em>No</em> if it has not been added yet. Products showing <em>No</em> will not appear on the website.
                                    </Text>
                                </Stack>
                            </AccordionPanel>
                        </AccordionItem>

                        {/* ── 3. Adding a New Product ── */}
                        <AccordionItem border="none" mb={3}>
                            <AccordionButton
                                bg="teal.50"
                                borderRadius="md"
                                _hover={{ bg: 'teal.100' }}
                                px={4} py={3}
                            >
                                <Box id="adding-a-brand-new-product" flex="1" textAlign="left">
                                    <Heading as="h2" size="md">3. Adding a Brand New Product</Heading>
                                </Box>
                                <AccordionIcon />
                            </AccordionButton>
                            <AccordionPanel pb={4} pt={4} px={2}>
                                <Stack spacing={4}>
                                    <Text>
                                        Adding a new product is a two-step process. First you create the product page (name, description, photo), then you set its price and stock in the Inventory Manager.
                                    </Text>

                                    <Heading as="h3" size="sm">Step 1 — Create the product in the content editor</Heading>
                                    <OrderedList spacing={2} pl={4}>
                                        <ListItem>
                                            Click the <strong>Edit Details (Sanity)</strong> button on any product, or go directly to the content editor at{' '}
                                            <Text as="a" href="/studio" color="teal.600" _hover={{ textDecoration: 'underline' }}>/studio</Text>.
                                        </ListItem>
                                        <ListItem>In the left panel, click <strong>Product</strong>, then click the <strong>+ Create</strong> to add a new one.</ListItem>
                                        <ListItem>Fill in the product <strong>Name</strong>, <strong>Description</strong>, and upload a <strong>Photo</strong>.</ListItem>
                                        <ListItem>Choose a <strong>Category</strong> (e.g. Drinks, Snacks) , then click <strong>Generate</strong> for the 'slug' and then click <strong>Publish</strong> in the bottom-right corner.</ListItem>
                                    </OrderedList>

                                    <Alert status="info" borderRadius="md">
                                        <AlertIcon />
                                        <AlertDescription>
                                            The content editor (Sanity Studio) is where product names, descriptions, and photos live. Think of it as the product's profile page.
                                        </AlertDescription>
                                    </Alert>

                                    <Heading as="h3" size="sm">Step 2 — Set the price and stock</Heading>
                                    <OrderedList spacing={2} pl={4}>
                                        <ListItem>Go to <strong>Inventory Manager</strong>.</ListItem>
                                        <ListItem>Search for the new product by name. It will appear with a yellow warning because it has no price or stock yet.</ListItem>
                                        <ListItem>Enter the <strong>Price (UGX)</strong> and <strong>Quantity</strong>.</ListItem>
                                        <ListItem>Click <strong>Publish Changes</strong>. The product will now appear on the website for customers.</ListItem>
                                    </OrderedList>
                                </Stack>
                            </AccordionPanel>
                        </AccordionItem>

                        {/* ── 4. Archiving & Restoring ── */}
                        <AccordionItem border="none" mb={3}>
                            <AccordionButton
                                bg="teal.50"
                                borderRadius="md"
                                _hover={{ bg: 'teal.100' }}
                                px={4} py={3}
                            >
                                <Box id="archiving--restoring-a-product" flex="1" textAlign="left">
                                    <Heading as="h2" size="md">4. Archiving &amp; Restoring a Product</Heading>
                                </Box>
                                <AccordionIcon />
                            </AccordionButton>
                            <AccordionPanel pb={4} pt={4} px={2}>
                                <Stack spacing={4}>
                                    <Heading as="h3" size="sm">What does archiving mean?</Heading>
                                    <Text>
                                        <strong>Archiving</strong> a product hides it from customers on the website — they will no longer see it or be able to buy it. The product is <em>not deleted</em>; all its details and stock information are kept safe. You can bring it back at any time.
                                    </Text>
                                    <Text>
                                        This is useful when a product is temporarily out of stock, seasonal, or no longer being sold for now.
                                    </Text>

                                    <Heading as="h3" size="sm">How to archive a product</Heading>
                                    <OrderedList spacing={2} pl={4}>
                                        <ListItem>Go to <strong>Inventory Manager</strong>.</ListItem>
                                        <ListItem>Find the product you want to hide.</ListItem>
                                        <ListItem>Click the orange <strong>Archive Item</strong> button at the bottom of the product's row.</ListItem>
                                        <ListItem>The row will turn grey with an <Badge colorScheme="orange" fontSize="xs">Archived</Badge> label. The product is now hidden from customers.</ListItem>
                                    </OrderedList>

                                    <Heading as="h3" size="sm">How to restore a product</Heading>
                                    <OrderedList spacing={2} pl={4}>
                                        <ListItem>Find the greyed-out product in the Inventory Manager.</ListItem>
                                        <ListItem>Click the <strong>Restore Item</strong> button.</ListItem>
                                        <ListItem>The product will return to normal and customers can see and buy it again.</ListItem>
                                    </OrderedList>

                                    <Alert status="info" borderRadius="md">
                                        <AlertIcon />
                                        <AlertDescription>
                                            Archiving and restoring is instant — no need to click Publish Changes for this action.
                                        </AlertDescription>
                                    </Alert>
                                </Stack>
                            </AccordionPanel>
                        </AccordionItem>

                        {/* ── 5. Low Stock Alerts ── */}
                        <AccordionItem border="none" mb={3}>
                            <AccordionButton
                                bg="teal.50"
                                borderRadius="md"
                                _hover={{ bg: 'teal.100' }}
                                px={4} py={3}
                            >
                                <Box id="low-stock-alerts" flex="1" textAlign="left">
                                    <Heading as="h2" size="md">5. Low Stock Alerts</Heading>
                                </Box>
                                <AccordionIcon />
                            </AccordionButton>
                            <AccordionPanel pb={4} pt={4} px={2}>
                                <Stack spacing={4}>
                                    <Text>
                                        The system can warn you when a product is running low so you know when to reorder.
                                    </Text>

                                    <Heading as="h3" size="sm">How it works</Heading>
                                    <UnorderedList spacing={2} pl={4}>
                                        <ListItem>
                                            Each product has a <strong>Min Stock</strong> number in the Inventory Manager. This is the minimum quantity you want to keep in stock before you get a warning.
                                        </ListItem>
                                        <ListItem>
                                            When the stock count drops to or below that number, a <Badge colorScheme="red">red alert banner</Badge> appears at the top of the Inventory Manager page listing the affected products.
                                        </ListItem>
                                        <ListItem>
                                            An <strong>email alert</strong> is also sent automatically to the store email address whenever you publish an update that triggers a low stock situation.
                                        </ListItem>
                                    </UnorderedList>

                                    <Heading as="h3" size="sm">Setting the minimum stock level</Heading>
                                    <OrderedList spacing={2} pl={4}>
                                        <ListItem>Find the product in the Inventory Manager.</ListItem>
                                        <ListItem>Click into the <strong>Min Stock</strong> box and type a number (e.g. <strong>5</strong> means you want to be alerted when fewer than 5 are left).</ListItem>
                                        <ListItem>Click <strong>Publish Changes</strong> to save.</ListItem>
                                    </OrderedList>

                                    <Alert status="info" borderRadius="md">
                                        <AlertIcon />
                                        <AlertDescription>
                                            If you leave the Min Stock box empty, no low stock alert will be triggered for that product.
                                        </AlertDescription>
                                    </Alert>
                                </Stack>
                            </AccordionPanel>
                        </AccordionItem>

                        {/* ── 6. Orders & Sales ── */}
                        <AccordionItem border="none" mb={3}>
                            <AccordionButton
                                bg="teal.50"
                                borderRadius="md"
                                _hover={{ bg: 'teal.100' }}
                                px={4} py={3}
                            >
                                <Box id="viewing-orders--sales" flex="1" textAlign="left">
                                    <Heading as="h2" size="md">6. Viewing Orders &amp; Sales</Heading>
                                </Box>
                                <AccordionIcon />
                            </AccordionButton>
                            <AccordionPanel pb={4} pt={4} px={2}>
                                <Stack spacing={4}>
                                    <Text>
                                        The <strong>Orders &amp; Sales</strong> page gives you a summary of what customers have been buying.
                                    </Text>

                                    <Heading as="h3" size="sm">How to get there</Heading>
                                    <OrderedList spacing={2} pl={4}>
                                        <ListItem>From the Control Centre, click <strong>Orders &amp; Sales</strong>.</ListItem>
                                        <ListItem>Or click <strong>Orders &amp; Sales</strong> in the navigation bar at the top.</ListItem>
                                    </OrderedList>

                                    <Heading as="h3" size="sm">What you can see</Heading>
                                    <UnorderedList spacing={2} pl={4}>
                                        <ListItem><strong>Sales overview</strong> — a summary of total revenue and order numbers at the top of the page.</ListItem>
                                        <ListItem><strong>Recent orders</strong> — a table listing the latest orders, showing the date, customer email, total amount, and payment status.</ListItem>
                                        <ListItem><strong>Best-selling products</strong> — which items are being bought most often, useful for planning restocks.</ListItem>
                                    </UnorderedList>

                                    <Heading as="h3" size="sm">Viewing the details of a specific order</Heading>
                                    <Text>
                                        Each row in the Recent Orders table is clickable. Click on any order to open a detailed view showing:
                                    </Text>
                                    <UnorderedList spacing={2} pl={4}>
                                        <ListItem><strong>Date &amp; time</strong> the order was placed.</ListItem>
                                        <ListItem><strong>Payment status</strong> — for example, <Badge colorScheme="green" fontSize="xs">COMPLETED</Badge> means the customer has paid successfully. <Badge colorScheme="blue" fontSize="xs">PENDING</Badge> means payment is still being processed. <Badge colorScheme="red" fontSize="xs">FAILED</Badge> means the payment did not go through.</ListItem>
                                        <ListItem><strong>Order total</strong> in UGX.</ListItem>
                                        <ListItem><strong>Items ordered</strong> — a breakdown of every product in the order, the quantity bought, the price per item, and the line total.</ListItem>
                                        <ListItem><strong>Customer contact details</strong> — their email address and phone number.</ListItem>
                                        <ListItem><strong>Delivery address</strong> — the location the customer entered at checkout, including a <strong>Google Maps pin</strong> so you can see exactly where to deliver.</ListItem>
                                    </UnorderedList>
                                    <Text>Click <strong>Close</strong> to go back to the orders list.</Text>

                                    <Heading as="h3" size="sm">Navigating through older orders</Heading>
                                    <Text>
                                        The orders list shows 15 orders per page. Use the <strong>Previous</strong> and <strong>Next</strong> buttons at the bottom of the table to move between pages.
                                    </Text>

                                    <Alert status="info" borderRadius="md">
                                        <AlertIcon />
                                        <AlertDescription>
                                            Orders are recorded automatically when a customer completes a payment. You do not need to do anything to capture them.
                                        </AlertDescription>
                                    </Alert>
                                </Stack>
                            </AccordionPanel>
                        </AccordionItem>

                        {/* ── 7. Store Hours ── */}
                        <AccordionItem border="none" mb={3}>
                            <AccordionButton
                                bg="teal.50"
                                borderRadius="md"
                                _hover={{ bg: 'teal.100' }}
                                px={4} py={3}
                            >
                                <Box id="changing-store-hours" flex="1" textAlign="left">
                                    <Heading as="h2" size="md">7. Changing Store Hours</Heading>
                                </Box>
                                <AccordionIcon />
                            </AccordionButton>
                            <AccordionPanel pb={4} pt={4} px={2}>
                                <Stack spacing={4}>
                                    <Text>
                                        Store hours control when customers can place orders. Outside of your set hours, the website shows a "store is closed" message and checkout is disabled.
                                    </Text>

                                    <Heading as="h3" size="sm">Updating opening and closing times</Heading>
                                    <OrderedList spacing={2} pl={4}>
                                        <ListItem>From the Control Centre, click <strong>Store Hours</strong>.</ListItem>
                                        <ListItem>You will see a table with a row for each day of the week.</ListItem>
                                        <ListItem>Click on the <strong>Open Time</strong> or <strong>Close Time</strong> box for a day and type the new time.</ListItem>
                                        <ListItem>When you are done, click the teal <strong>Save All Hours</strong> button at the bottom.</ListItem>
                                    </OrderedList>

                                    <Heading as="h3" size="sm">Closing for a day off</Heading>
                                    <OrderedList spacing={2} pl={4}>
                                        <ListItem>Find the day you want to close in the table.</ListItem>
                                        <ListItem>Tick the <strong>Closed All Day</strong> checkbox in that row. The time boxes will grey out.</ListItem>
                                        <ListItem>Click <strong>Save All Hours</strong>.</ListItem>
                                    </OrderedList>

                                    <Alert status="info" borderRadius="md">
                                        <AlertIcon />
                                        <AlertDescription>
                                            All times are East Africa Time (EAT, UTC+3) — the same timezone as Uganda.
                                        </AlertDescription>
                                    </Alert>
                                </Stack>
                            </AccordionPanel>
                        </AccordionItem>

                        {/* ── 8. Quick Reference ── */}
                        <AccordionItem border="none" mb={3}>
                            <AccordionButton
                                bg="teal.50"
                                borderRadius="md"
                                _hover={{ bg: 'teal.100' }}
                                px={4} py={3}
                            >
                                <Box id="quick-reference" flex="1" textAlign="left">
                                    <Heading as="h2" size="md">8. Quick Reference</Heading>
                                </Box>
                                <AccordionIcon />
                            </AccordionButton>
                            <AccordionPanel pb={4} pt={4} px={2}>
                                <Box overflowX="auto">
                                    <Table variant="simple" size="sm">
                                        <Thead>
                                            <Tr>
                                                <Th>Task</Th>
                                                <Th>Where to go</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            <Tr>
                                                <Td>Change a product's price</Td>
                                                <Td>Inventory Manager → edit Price column → Publish Changes</Td>
                                            </Tr>
                                            <Tr>
                                                <Td>Update how many are in stock</Td>
                                                <Td>Inventory Manager → edit Quantity column → Publish Changes</Td>
                                            </Tr>
                                            <Tr>
                                                <Td>Set a restock reminder</Td>
                                                <Td>Inventory Manager → edit Min Stock column → Publish Changes</Td>
                                            </Tr>
                                            <Tr>
                                                <Td>Add a brand new product</Td>
                                                <Td>Content Editor (Sanity Studio) → create product → then set price/stock in Inventory Manager</Td>
                                            </Tr>
                                            <Tr>
                                                <Td>Hide a product from customers</Td>
                                                <Td>Inventory Manager → Archive Item button (orange)</Td>
                                            </Tr>
                                            <Tr>
                                                <Td>Bring a hidden product back</Td>
                                                <Td>Inventory Manager → Restore Item button (green)</Td>
                                            </Tr>
                                            <Tr>
                                                <Td>See recent orders</Td>
                                                <Td>Orders &amp; Sales</Td>
                                            </Tr>
                                            <Tr>
                                                <Td>See best-selling products</Td>
                                                <Td>Orders &amp; Sales</Td>
                                            </Tr>
                                            <Tr>
                                                <Td>Change opening/closing times</Td>
                                                <Td>Store Hours → edit times → Save All Hours</Td>
                                            </Tr>
                                            <Tr>
                                                <Td>Close the shop for a day</Td>
                                                <Td>Store Hours → tick "Closed All Day" → Save All Hours</Td>
                                            </Tr>
                                            <Tr>
                                                <Td>Edit a product's name, description, or photo</Td>
                                                <Td>Inventory Manager → Edit Details (Sanity) button (blue)</Td>
                                            </Tr>
                                        </Tbody>
                                    </Table>
                                </Box>
                            </AccordionPanel>
                        </AccordionItem>

                    </Accordion>

                    <Divider />

                    <Box textAlign="center">
                        <Button as={NextLink} href="/admin" colorScheme="teal" variant="outline">
                            ← Back to Control Centre
                        </Button>
                    </Box>
                </Stack>
            </Container>
        </>
    );
}
