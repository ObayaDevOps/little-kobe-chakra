import { getServerSupabaseClient } from '@/lib/supabaseClient';
import {
    DEFAULT_ALLOW_FALLBACK_TO_META,
    DEFAULT_PROVIDER,
    PROVIDER_VALUES,
} from '@/lib/whatsapp/constants';

const SETTINGS_TABLE = 'whatsapp_provider_settings';
const SETTINGS_KEY = 'global';
const TEMPLATES_TABLE = 'whatsapp_templates';

const toBool = (value, fallback = false) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const lowered = value.trim().toLowerCase();
        if (lowered === 'true') return true;
        if (lowered === 'false') return false;
    }
    return fallback;
};

const normalizeProvider = (value, fallback = DEFAULT_PROVIDER) => {
    if (typeof value !== 'string') return fallback;
    const lowered = value.trim().toLowerCase();
    return PROVIDER_VALUES.includes(lowered) ? lowered : fallback;
};

const mapSettingsRow = (row) => ({
    key: SETTINGS_KEY,
    activeProvider: normalizeProvider(row?.active_provider, DEFAULT_PROVIDER),
    allowFallbackToMeta: toBool(row?.allow_fallback_to_meta, DEFAULT_ALLOW_FALLBACK_TO_META),
    updatedAt: row?.updated_at || null,
    createdAt: row?.created_at || null,
});

const fallbackSettings = () => ({
    key: SETTINGS_KEY,
    activeProvider: normalizeProvider(process.env.WHATSAPP_PROVIDER_DEFAULT, DEFAULT_PROVIDER),
    allowFallbackToMeta: toBool(
        process.env.WHATSAPP_PROVIDER_ALLOW_FALLBACK,
        DEFAULT_ALLOW_FALLBACK_TO_META
    ),
    updatedAt: null,
    createdAt: null,
});

export async function getWhatsAppProviderSettings() {
    const supabase = getServerSupabaseClient();
    try {
        const { data, error } = await supabase
            .from(SETTINGS_TABLE)
            .select('*')
            .eq('setting_key', SETTINGS_KEY)
            .maybeSingle();

        if (error) {
            throw error;
        }
        if (!data) {
            return fallbackSettings();
        }
        return mapSettingsRow(data);
    } catch (error) {
        console.warn('Falling back to env WhatsApp settings:', error.message);
        return fallbackSettings();
    }
}

export async function upsertWhatsAppProviderSettings({
    activeProvider,
    allowFallbackToMeta,
}) {
    const supabase = getServerSupabaseClient();
    const payload = {
        setting_key: SETTINGS_KEY,
        active_provider: normalizeProvider(activeProvider, DEFAULT_PROVIDER),
        allow_fallback_to_meta: toBool(
            allowFallbackToMeta,
            DEFAULT_ALLOW_FALLBACK_TO_META
        ),
        updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
        .from(SETTINGS_TABLE)
        .upsert(payload, { onConflict: 'setting_key' })
        .select('*')
        .single();

    if (error) {
        throw new Error(`Failed to save WhatsApp provider settings: ${error.message}`);
    }

    return mapSettingsRow(data);
}

const normalizeTemplateScope = (value) => {
    if (value === 'all') return 'all';
    const normalized = normalizeProvider(value, 'all');
    return PROVIDER_VALUES.includes(normalized) ? normalized : 'all';
};

const normalizeTemplateRow = (row) => ({
    id: row?.id,
    name: row?.name || '',
    slug: row?.slug || '',
    providerScope: normalizeTemplateScope(row?.provider_scope),
    bodyText: row?.body_text || '',
    variables: row?.variables_json && typeof row.variables_json === 'object'
        ? row.variables_json
        : {},
    isActive: Boolean(row?.is_active),
    createdAt: row?.created_at || null,
    updatedAt: row?.updated_at || null,
});

const normalizeSlug = (value) => String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

const normalizeTemplatePayload = (template = {}) => {
    const name = String(template.name || '').trim();
    const slug = normalizeSlug(template.slug || name);
    const bodyText = String(template.bodyText || template.body_text || '').trim();
    const providerScope = normalizeTemplateScope(template.providerScope || template.provider_scope || 'all');
    const variables = template.variables && typeof template.variables === 'object'
        ? template.variables
        : {};
    const isActive = toBool(template.isActive ?? template.is_active, true);

    if (!name) {
        throw new Error('Template name is required.');
    }
    if (!slug) {
        throw new Error('Template slug is required.');
    }
    if (!bodyText) {
        throw new Error('Template body text is required.');
    }

    return {
        name,
        slug,
        body_text: bodyText,
        provider_scope: providerScope,
        variables_json: variables,
        is_active: isActive,
    };
};

export async function listWhatsAppTemplates({ includeInactive = true } = {}) {
    const supabase = getServerSupabaseClient();
    let query = supabase
        .from(TEMPLATES_TABLE)
        .select('*')
        .order('updated_at', { ascending: false });

    if (!includeInactive) {
        query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) {
        throw new Error(`Failed to fetch WhatsApp templates: ${error.message}`);
    }
    return (data || []).map(normalizeTemplateRow);
}

export async function getWhatsAppTemplateBySlug(slug, { onlyActive = true } = {}) {
    const normalizedSlug = normalizeSlug(slug);
    if (!normalizedSlug) return null;
    const supabase = getServerSupabaseClient();
    let query = supabase
        .from(TEMPLATES_TABLE)
        .select('*')
        .eq('slug', normalizedSlug)
        .limit(1);
    if (onlyActive) {
        query = query.eq('is_active', true);
    }
    query = query.maybeSingle();

    const { data, error } = await query;
    if (error) {
        throw new Error(`Failed to fetch template by slug: ${error.message}`);
    }
    return data ? normalizeTemplateRow(data) : null;
}

export async function createWhatsAppTemplate(template) {
    const supabase = getServerSupabaseClient();
    const payload = normalizeTemplatePayload(template);
    const { data, error } = await supabase
        .from(TEMPLATES_TABLE)
        .insert(payload)
        .select('*')
        .single();
    if (error) {
        throw new Error(`Failed to create WhatsApp template: ${error.message}`);
    }
    return normalizeTemplateRow(data);
}

export async function updateWhatsAppTemplate(id, template) {
    if (!id) {
        throw new Error('Template ID is required.');
    }
    const supabase = getServerSupabaseClient();
    const payload = normalizeTemplatePayload(template);
    const { data, error } = await supabase
        .from(TEMPLATES_TABLE)
        .update({
            ...payload,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single();
    if (error) {
        throw new Error(`Failed to update WhatsApp template: ${error.message}`);
    }
    return normalizeTemplateRow(data);
}

export async function deleteWhatsAppTemplate(id) {
    if (!id) {
        throw new Error('Template ID is required.');
    }
    const supabase = getServerSupabaseClient();
    const { error } = await supabase
        .from(TEMPLATES_TABLE)
        .delete()
        .eq('id', id);
    if (error) {
        throw new Error(`Failed to delete WhatsApp template: ${error.message}`);
    }
    return { deleted: true };
}
