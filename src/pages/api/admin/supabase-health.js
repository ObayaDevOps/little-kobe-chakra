import { checkSupabaseHealth } from '@/lib/healthChecks';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }

    const table = typeof req.query.table === 'string' && req.query.table.trim()
        ? req.query.table.trim()
        : undefined;
    const columns = typeof req.query.columns === 'string' && req.query.columns.trim()
        ? req.query.columns.trim()
        : undefined;
    const limit = Number.parseInt(String(req.query.limit ?? ''), 10);

    const result = await checkSupabaseHealth({
        table,
        columns,
        limit: Number.isFinite(limit) && limit > 0 ? limit : undefined
    });

    if (!result.ok) {
        console.error('Supabase health check error:', result.error);
    }

    return res.status(result.httpStatus ?? (result.ok ? 200 : 500)).json(result);
}
