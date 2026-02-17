// pages/api/whatsapp/send-order-confirmation.js
import { sendOrderConfirmationWhatsApp } from '@/lib/whatsappNotification';

const isInternalAuthorized = (req) => {
    const configuredKey = process.env.INTERNAL_API_KEY;
    if (!configuredKey) {
        return process.env.NODE_ENV !== 'production';
    }
    const provided = req.headers['x-internal-api-key'];
    return typeof provided === 'string' && provided === configuredKey;
};

const isTestAuthorized = (req) => {
    if (process.env.WHATSAPP_ENABLE_TEST_MODE !== 'true') {
        return false;
    }
    const configuredSecret = process.env.WHATSAPP_TEST_SECRET;
    if (!configuredSecret) {
        return process.env.NODE_ENV !== 'production';
    }
    const headerSecret = req.headers['x-whatsapp-test-secret'];
    const querySecret = req.query.secret;
    const provided = typeof headerSecret === 'string' ? headerSecret : querySecret;
    return typeof provided === 'string' && provided === configuredSecret;
};

export default async function handler(req, res) {
    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const isTestMode = req.query.test === 'true';
    let recipientPhoneNumber;
    let orderDetails;
    let isShopkeeper = false;

    if (isTestMode) {
        if (req.method !== 'GET') {
            return res.status(405).json({ message: 'Test mode only supports GET.' });
        }
        if (!isTestAuthorized(req)) {
            return res.status(401).json({ message: 'Unauthorized test-mode request.' });
        }
        recipientPhoneNumber = req.query.testRecipient;
        isShopkeeper = req.query.isShopkeeperTest === 'true';
        orderDetails = {
            customerName: 'Test Customer',
            customerPhoneNumber: '+15551234567',
            items: [
                { name: 'Test Item 1', quantity: 2, price: 1000 },
                { name: 'Test Item 2', quantity: 1, price: 5000 }
            ],
            delivery_address: {
                line_1: '123 Test St',
                city: 'Test City'
            },
            totalAmount: 7000,
            estimatedDelivery: 'Tomorrow',
            merchantReference: 'TEST-REF-123',
            confirmationCode: 'TESTCODE789'
        };

        if (!recipientPhoneNumber) {
            return res.status(400).json({ message: "Test mode requires 'testRecipient' query parameter." });
        }
    } else {
        if (req.method !== 'POST') {
            return res.status(405).json({ message: 'Method Not Allowed for non-test requests.' });
        }
        if (!isInternalAuthorized(req)) {
            return res.status(401).json({ message: 'Unauthorized request.' });
        }
        ({ recipientPhoneNumber, orderDetails, isShopkeeper } = req.body);

        if (!recipientPhoneNumber || !orderDetails) {
            return res.status(400).json({ message: 'Missing recipientPhoneNumber or orderDetails in request body.' });
        }
    }

    try {
        const data = await sendOrderConfirmationWhatsApp({ recipientPhoneNumber, orderDetails, isShopkeeper: Boolean(isShopkeeper) });
        return res.status(200).json({ message: 'WhatsApp message sent successfully', data });
    } catch (error) {
        console.error('Error sending WhatsApp message:', error.response?.data || error.message);
        return res.status(500).json({ message: 'Error sending WhatsApp message', error: error.response?.data || error.message });
    }
}
