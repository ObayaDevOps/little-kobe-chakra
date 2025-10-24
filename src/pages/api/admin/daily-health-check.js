import { checkSupabaseHealth, checkWhatsAppHealth } from '@/lib/healthChecks';
import { sendHealthAlertEmail } from '@/lib/emailNotification';

const verifySecret = (req) => {
    const expected = process.env.HEALTHCHECK_SECRET;
    if (!expected) return true;

    const headerValue = req.headers['x-healthcheck-secret'];
    const queryValue = req.query.secret;
    const provided = Array.isArray(headerValue) ? headerValue[0] : headerValue
        || (Array.isArray(queryValue) ? queryValue[0] : queryValue);
    if (provided && String(provided) === expected) {
        return true;
    }
    return false;
};

export default async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }

    if (!verifySecret(req)) {
        return res.status(401).json({ message: 'Unauthorized: invalid health check secret.' });
    }

    const triggeredAt = new Date().toISOString();

    const supabaseLimit = Number.parseInt(process.env.HEALTHCHECK_SUPABASE_LIMIT || '', 10);
    const supabase = await checkSupabaseHealth({
        table: process.env.HEALTHCHECK_SUPABASE_TABLE || undefined,
        columns: process.env.HEALTHCHECK_SUPABASE_COLUMNS || undefined,
        limit: Number.isFinite(supabaseLimit) && supabaseLimit > 0 ? supabaseLimit : undefined
    });
    const whatsapp = await checkWhatsAppHealth();

    const ok = Boolean(supabase?.ok) && Boolean(whatsapp?.ok);

    let notification = { attempted: false, success: false, error: null };

    if (!ok) {
        notification.attempted = true;
        try {
            await sendHealthAlertEmail({ supabase, whatsapp, triggeredAt });
            notification.success = true;
        } catch (error) {
            console.error('Health alert email failed:', error);
            notification.error = error.message;
        }
    }

    const status = ok ? 200 : 503;
    return res.status(status).json({
        ok,
        triggeredAt,
        supabase,
        whatsapp,
        notification
    });
}
