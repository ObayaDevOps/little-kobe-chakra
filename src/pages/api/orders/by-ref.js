import { getPaymentByMerchantReference } from '@/lib/db';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { ref } = req.query;

    if (!ref) {
        return res.status(400).json({ message: 'Order reference is required.' });
    }

    const { data, error } = await getPaymentByMerchantReference(ref);

    if (error) {
        return res.status(500).json({ message: 'Failed to fetch order details.' });
    }

    if (!data) {
        return res.status(404).json({ message: 'Order not found.' });
    }

    return res.status(200).json({ order: data });
}
