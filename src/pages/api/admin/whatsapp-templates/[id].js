import {
    deleteWhatsAppTemplate,
    updateWhatsAppTemplate,
} from '@/lib/whatsapp/settingsStore';

export default async function handler(req, res) {
    const id = req.query.id;
    if (!id || typeof id !== 'string') {
        return res.status(400).json({ message: 'Template id is required.' });
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
        try {
            const template = await updateWhatsAppTemplate(id, req.body || {});
            return res.status(200).json({ message: 'Template updated.', template });
        } catch (error) {
            console.error(`Failed to update template ${id}:`, error);
            return res.status(500).json({ message: error.message });
        }
    }

    if (req.method === 'DELETE') {
        try {
            const result = await deleteWhatsAppTemplate(id);
            return res.status(200).json(result);
        } catch (error) {
            console.error(`Failed to delete template ${id}:`, error);
            return res.status(500).json({ message: error.message });
        }
    }

    res.setHeader('Allow', ['PUT', 'PATCH', 'DELETE']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
}
