// pages/api/whatsapp/send-order-confirmation.js
import axios from 'axios';

export default async function handler(req, res) {
    if (req.method !== 'POST' && req.method !== 'GET') { // Allow GET for easy testing via browser
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // --- Test Mode Configuration ---
    const isTestMode = req.query.test === 'true';
    let recipientPhoneNumber;
    let orderDetails;
    let isShopkeeper = false; // Default to customer for test unless specified

    if (isTestMode) {
        console.log("--- Running WhatsApp send in TEST MODE ---");
        recipientPhoneNumber = req.query.testRecipient; // Get recipient from query param
        isShopkeeper = req.query.isShopkeeperTest === 'true'; // Allow testing shopkeeper flow

        // Define test data
        orderDetails = {
            customerName: "Test Customer",
            customerPhoneNumber: "+15551234567", // Test customer number
            items: [
                { name: "Test Item 1", quantity: 2, price: 1000 },
                { name: "Test Item 2", quantity: 1, price: 5000 }
            ],
            delivery_address: {
                address: "123 Test St",
                city: "Test City"
            },
            totalAmount: 7000,
            estimatedDelivery: "Tomorrow",
            merchantReference: "TEST-REF-123",
            confirmationCode: "TESTCODE789"
        };

        if (!recipientPhoneNumber) {
            console.error("Test mode requires 'testRecipient' query parameter.");
            return res.status(400).json({ message: "Test mode requires 'testRecipient' query parameter with a phone number." });
        }
         console.log(`Test recipient: ${recipientPhoneNumber}, isShopkeeperTest: ${isShopkeeper}`);

    } else {
        // --- Normal Operation ---
        if (req.method !== 'POST') {
             return res.status(405).json({ message: 'Method Not Allowed for non-test requests' });
        }
        ({ recipientPhoneNumber, orderDetails, isShopkeeper } = req.body);

        if (!recipientPhoneNumber || !orderDetails) {
            return res.status(400).json({ message: 'Missing recipientPhoneNumber or orderDetails in request body' });
        }
         console.log(`Normal operation: Sending to ${recipientPhoneNumber}`);
    }
    // --- End Test Mode Configuration ---


    const whatsappApiUrl = `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const templateName = 'order_management_1'; // Your template name

    if (!whatsappApiUrl || !accessToken || !process.env.WHATSAPP_PHONE_NUMBER_ID || !process.env.WHATSAPP_API_VERSION) {
         console.error("Missing WhatsApp environment variables");
         return res.status(500).json({ message: 'Server configuration error: WhatsApp environment variables not set.' });
     }
     // Ensure shopkeeper contact is available if needed for the template
     // Using ?? for nullish coalescing (handles null or undefined)
     const shopkeeperContact = process.env.NEXT_PUBLIC_SHOPKEEPER_WA_NUMBER ?? "Shopkeeper contact not set";
     if (shopkeeperContact === "Shopkeeper contact not set" && !isShopkeeper) {
          console.warn("NEXT_PUBLIC_SHOPKEEPER_WA_NUMBER environment variable not set. Template variable {{6}} might be missing for customer messages.");
     }


    try {
        // Constructing the template message components
        // Ensure orderDetails and nested properties exist before accessing
        // Using ?? for nullish coalescing (handles null or undefined) and String() to ensure it's a string
        const customerName = String(orderDetails?.customerName ?? "Customer");
        const itemsList = String(orderDetails?.items?.map(item => `${String(item?.quantity ?? 1)} ${String(item?.name ?? 'Unnamed Item')}`).join(', ') ?? "No items listed");
        const deliveryAddress = String(orderDetails?.delivery_address ? `${String(orderDetails.delivery_address.address ?? '')}, ${String(orderDetails.delivery_address.city ?? '')}`.trim().replace(/^, /,'').replace(/,$/,'') || "not specified" : "not specified");
        const estimatedDelivery = String(orderDetails?.estimatedDelivery ?? "not specified");
        const contactInfo = String(isShopkeeper ? (orderDetails?.customerPhoneNumber ?? "Customer number not available") : shopkeeperContact);


        const components = [
            {
                type: "body",
                parameters: [
                    { type: "text", text: customerName }, // {{1}} Name
                    { type: "text", text: "order" }, // {{2}} Purchase/Order type - changed to "order"
                    { type: "text", text: itemsList }, // {{3}} Items Ordered
                    { type: "text", text: estimatedDelivery }, // {{4}} Estimated delivery
                    { type: "text", text: deliveryAddress }, // {{5}} Delivery Location
                    { type: "text", text: contactInfo } // {{6}} Contact info
                ]
            }
        ];

        const whatsappPayload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: recipientPhoneNumber,
            type: "template",
            template: {
                name: templateName,
                language: {
                    code: "en_US" // Or the appropriate language code for your template
                },
                components: components
            }
        };

         // Optional: Log the constructed payload for debugging - Moved after whatsappPayload is defined
         console.log("Sending WhatsApp payload:", JSON.stringify(whatsappPayload, null, 2));
        console.log(`Sending WhatsApp message to ${recipientPhoneNumber}...`);

        const response = await axios.post(whatsappApiUrl, whatsappPayload, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log("WhatsApp API response:", response.data);

        if (response.data.messages && response.data.messages.length > 0) {
            console.log("WhatsApp message sent successfully.");
            return res.status(200).json({ message: 'WhatsApp message sent successfully', data: response.data });
        } else {
            console.error("WhatsApp API did not return a success message:", response.data);
             return res.status(500).json({ message: 'Failed to send WhatsApp message', details: response.data });
        }

    } catch (error) {
        console.error("Error sending WhatsApp message:", error.response?.data || error.message);
        return res.status(500).json({ message: 'Error sending WhatsApp message', error: error.response?.data || error.message });
    }
}