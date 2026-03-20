import axios from 'axios';
import { getServerSupabaseClient } from '@/lib/supabaseClient';
import { getWhatsAppProviderSettings } from '@/lib/whatsapp/settingsStore';
import { checkBaileysHealth } from '@/lib/whatsapp/baileysProvider';
import { DEFAULT_PROVIDER } from '@/lib/whatsapp/constants';

const DEFAULT_TABLE = 'orders';
const DEFAULT_COLUMNS = '*';
const DEFAULT_LIMIT = 1;

export const checkSupabaseHealth = async ({ table = DEFAULT_TABLE, columns = DEFAULT_COLUMNS, limit = DEFAULT_LIMIT } = {}) => {
    const startedAt = Date.now();
    try {
        const supabase = getServerSupabaseClient();
        const query = supabase
            .from(table)
            .select(columns)
            .limit(limit);

        const { data, error, status, statusText } = await query;
        const latencyMs = Date.now() - startedAt;

        if (error) {
            return {
                ok: false,
                httpStatus: 503,
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
            };
        }

        return {
            ok: true,
            httpStatus: 200,
            latencyMs,
            status,
            statusText,
            rowCount: Array.isArray(data) ? data.length : null,
            sample: Array.isArray(data) && data.length > 0 ? data[0] : null,
            context: { table, columns, limit }
        };
    } catch (error) {
        const latencyMs = Date.now() - startedAt;
        return {
            ok: false,
            httpStatus: 500,
            latencyMs,
            error: {
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            context: { table, columns, limit }
        };
    }
};

export const checkMetaWhatsAppHealth = async () => {
    const version = process.env.WHATSAPP_API_VERSION;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!version || !phoneNumberId || !accessToken) {
        return {
            ok: false,
            httpStatus: 500,
            error: {
                message: 'WhatsApp API credentials are not fully configured.',
                missing: {
                    WHATSAPP_API_VERSION: Boolean(version),
                    WHATSAPP_PHONE_NUMBER_ID: Boolean(phoneNumberId),
                    WHATSAPP_ACCESS_TOKEN: Boolean(accessToken)
                }
            }
        };
    }

    const url = `https://graph.facebook.com/${version}/${phoneNumberId}`;
    const startedAt = Date.now();

    try {
        const response = await axios.get(url, {
            params: { fields: 'id,verified_name,display_phone_number' },
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        return {
            ok: true,
            httpStatus: 200,
            latencyMs: Date.now() - startedAt,
            status: response.status,
            statusText: response.statusText,
            data: response.data
        };
    } catch (error) {
        const latencyMs = Date.now() - startedAt;
        const axiosResponse = error.response;
        return {
            ok: false,
            httpStatus: axiosResponse?.status ?? 502,
            latencyMs,
            error: {
                message: axiosResponse?.data?.error?.message || error.message,
                details: axiosResponse?.data,
                status: axiosResponse?.status,
                statusText: axiosResponse?.statusText
            }
        };
    }
};

export const checkWhatsAppHealth = async ({ provider = 'auto' } = {}) => {
    const settings = await getWhatsAppProviderSettings();
    const activeProvider = provider === 'auto'
        ? settings.activeProvider || DEFAULT_PROVIDER
        : provider;

    const [meta, baileys] = await Promise.all([
        checkMetaWhatsAppHealth(),
        checkBaileysHealth(),
    ]);

    const selectedHealth = activeProvider === 'baileys_wa' ? baileys : meta;
    const ok = Boolean(selectedHealth?.ok);
    const httpStatus = ok ? 200 : (selectedHealth?.httpStatus || 503);

    return {
        ok,
        httpStatus,
        latencyMs: selectedHealth?.latencyMs ?? null,
        error: ok ? null : (selectedHealth?.error || { message: 'Selected provider is not healthy.' }),
        activeProvider,
        settings,
        providers: {
            meta_api: meta,
            baileys_wa: baileys,
        },
    };
};
