import { checkWhatsAppHealth } from '@/lib/healthChecks';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }

    try {
        const provider = typeof req.query.provider === 'string' ? req.query.provider : 'auto';
        const result = await checkWhatsAppHealth({ provider });
        return res.status(result.httpStatus || (result.ok ? 200 : 503)).json(result);
    } catch (error) {
        console.error('WhatsApp health endpoint failed:', error);
        return res.status(500).json({ ok: false, message: error.message });
    }
}
