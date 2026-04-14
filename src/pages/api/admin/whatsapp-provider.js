import {
    getWhatsAppProviderSettings,
    upsertWhatsAppProviderSettings,
} from '@/lib/whatsapp/settingsStore';
import { PROVIDER_VALUES } from '@/lib/whatsapp/constants';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const settings = await getWhatsAppProviderSettings();
            return res.status(200).json({ settings });
        } catch (error) {
            console.error('Failed to fetch WhatsApp provider settings:', error);
            return res.status(500).json({ message: error.message });
        }
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
        try {
            const activeProvider = String(req.body?.activeProvider || '').trim().toLowerCase();
            const allowFallbackToMeta = req.body?.allowFallbackToMeta;

            if (!PROVIDER_VALUES.includes(activeProvider)) {
                return res.status(400).json({
                    message: `activeProvider must be one of: ${PROVIDER_VALUES.join(', ')}`,
                });
            }

            const settings = await upsertWhatsAppProviderSettings({
                activeProvider,
                allowFallbackToMeta,
            });
            return res.status(200).json({ message: 'Settings updated.', settings });
        } catch (error) {
            console.error('Failed to update WhatsApp provider settings:', error);
            return res.status(500).json({ message: error.message });
        }
    }

    res.setHeader('Allow', ['GET', 'PUT', 'PATCH']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
}
