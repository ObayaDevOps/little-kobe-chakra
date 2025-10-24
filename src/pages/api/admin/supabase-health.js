import { getServerSupabaseClient } from '@/lib/supabaseClient';

const DEFAULT_TABLE = 'orders';
const DEFAULT_COLUMNS = '*';
const DEFAULT_LIMIT = 1;

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }

    const supabase = getServerSupabaseClient();

    const table = typeof req.query.table === 'string' && req.query.table.trim()
        ? req.query.table.trim()
        : DEFAULT_TABLE;
    const columns = typeof req.query.columns === 'string' && req.query.columns.trim()
        ? req.query.columns.trim()
        : DEFAULT_COLUMNS;
    const limit = Number.parseInt(String(req.query.limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT;

    const startedAt = Date.now();

    try {
        const query = supabase
            .from(table)
            .select(columns)
            .limit(limit);

        const { data, error, status, statusText } = await query;
        const latencyMs = Date.now() - startedAt;

        if (error) {
            console.error('Supabase health check error:', error);
            return res.status(503).json({
                ok: false,
                latencyMs,
                status,
                statusText,
                error: {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                },
                context: { table, columns, limit }
            });
        }

        return res.status(200).json({
            ok: true,
            latencyMs,
            status,
            statusText,
            rowCount: Array.isArray(data) ? data.length : null,
            sample: Array.isArray(data) && data.length > 0 ? data[0] : null,
            context: { table, columns, limit }
        });
    } catch (error) {
        console.error('Unexpected Supabase health check failure:', error);
        const latencyMs = Date.now() - startedAt;
        return res.status(500).json({
            ok: false,
            latencyMs,
            error: {
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            context: { table, columns, limit }
        });
    }
}
