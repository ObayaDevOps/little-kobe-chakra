import {
    getWhatsAppProviderSettings,
    upsertShopkeeperWaNumber,
} from '@/lib/whatsapp/settingsStore';

const E164_REGEX = /^\+\d{7,15}$/;

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const settings = await getWhatsAppProviderSettings();
            const fromDb = settings.shopkeeperWaNumber !== null &&
                settings.shopkeeperWaNumber !== (process.env.SHOPKEEPER_WA_NUMBER || process.env.NEXT_PUBLIC_SHOPKEEPER_WA_NUMBER);
            return res.status(200).json({
                shopkeeperWaNumber: settings.shopkeeperWaNumber,
                source: settings.updatedAt && settings.shopkeeperWaNumber ? 'db' : 'env',
            });
        } catch (error) {
            console.error('Failed to fetch shopkeeper settings:', error);
            return res.status(500).json({ message: error.message });
        }
    }

    if (req.method === 'PUT') {
        try {
            const number = String(req.body?.shopkeeperWaNumber || '').trim();

            if (!number) {
                return res.status(400).json({ message: 'shopkeeperWaNumber is required.' });
            }
            if (!E164_REGEX.test(number)) {
                return res.status(400).json({
                    message: 'shopkeeperWaNumber must be in E.164 format (e.g. +256700000000).',
                });
            }

            const settings = await upsertShopkeeperWaNumber(number);
            return res.status(200).json({
                message: 'Shopkeeper WA number saved.',
                shopkeeperWaNumber: settings.shopkeeperWaNumber,
                source: 'db',
            });
        } catch (error) {
            console.error('Failed to update shopkeeper settings:', error);
            return res.status(500).json({ message: error.message });
        }
    }

    res.setHeader('Allow', ['GET', 'PUT']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
}
