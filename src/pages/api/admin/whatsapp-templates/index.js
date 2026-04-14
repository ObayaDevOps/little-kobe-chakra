import {
    createWhatsAppTemplate,
    listWhatsAppTemplates,
} from '@/lib/whatsapp/settingsStore';
import {
    DEFAULT_BAILEYS_TEMPLATE,
    buildTemplateVariables,
    renderTemplateText,
} from '@/lib/whatsapp/templateRenderer';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const includeInactive = req.query.includeInactive !== 'false';
            const templates = await listWhatsAppTemplates({ includeInactive });
            return res.status(200).json({
                templates,
                defaultTemplate: DEFAULT_BAILEYS_TEMPLATE,
            });
        } catch (error) {
            console.error('Failed to list WhatsApp templates:', error);
            return res.status(500).json({ message: error.message });
        }
    }

    if (req.method === 'POST') {
        try {
            const created = await createWhatsAppTemplate(req.body || {});
            return res.status(201).json({ message: 'Template created.', template: created });
        } catch (error) {
            console.error('Failed to create WhatsApp template:', error);
            return res.status(500).json({ message: error.message });
        }
    }

    if (req.method === 'PUT') {
        // Lightweight preview endpoint to avoid a separate API path.
        try {
            const bodyText = String(req.body?.bodyText || '');
            const sampleOrderDetails = req.body?.sampleOrderDetails && typeof req.body.sampleOrderDetails === 'object'
                ? req.body.sampleOrderDetails
                : {};
            const variables = {
                ...buildTemplateVariables({ orderDetails: sampleOrderDetails, isShopkeeper: true }),
                ...(req.body?.variables && typeof req.body.variables === 'object' ? req.body.variables : {}),
            };
            const previewText = renderTemplateText(bodyText, variables);
            return res.status(200).json({ previewText, variables });
        } catch (error) {
            console.error('Failed to render WhatsApp template preview:', error);
            return res.status(500).json({ message: error.message });
        }
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
}
