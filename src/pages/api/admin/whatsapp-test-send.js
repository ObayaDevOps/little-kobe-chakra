import { sendOrderConfirmationWithProvider } from '@/lib/whatsapp/providerService';

const TEST_ORDER = {
    customerName: 'Test Customer',
    customerPhoneNumber: '+15551234567',
    items: [
        { name: 'Test Item 1', quantity: 2, price: 1000 },
        { name: 'Test Item 2', quantity: 1, price: 5000 },
    ],
    delivery_address: { line_1: '123 Test St', city: 'Test City' },
    totalAmount: 7000,
    estimatedDelivery: 'Tomorrow',
    merchantReference: 'TEST-REF-123',
    confirmationCode: 'TESTCODE789',
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { recipientPhoneNumber, isShopkeeper = false, provider, templateSlug } = req.body;

    if (!recipientPhoneNumber) {
        return res.status(400).json({ message: 'recipientPhoneNumber is required.' });
    }

    try {
        const result = await sendOrderConfirmationWithProvider({
            recipientPhoneNumber,
            orderDetails: TEST_ORDER,
            isShopkeeper: Boolean(isShopkeeper),
            provider,
            templateSlug: templateSlug || undefined,
        });
        return res.status(200).json({
            message: 'Test message sent successfully',
            data: result.data,
            provider: result.providerUsed,
            attemptedProvider: result.attemptedProvider,
            fallbackUsed: result.fallbackUsed,
            fallbackReason: result.fallbackReason || null,
            messageId: result.messageId || null,
        });
    } catch (error) {
        console.error('Admin WhatsApp test send failed:', error.response?.data || error.message);
        return res.status(500).json({
            message: 'Failed to send test message',
            error: error.response?.data || error.message,
        });
    }
}
