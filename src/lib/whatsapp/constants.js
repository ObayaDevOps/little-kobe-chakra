export const WHATSAPP_PROVIDERS = Object.freeze({
    META_API: 'meta_api',
    BAILEYS_WA: 'baileys_wa',
    AUTO: 'auto',
});

export const DEFAULT_PROVIDER = WHATSAPP_PROVIDERS.META_API;
export const DEFAULT_ALLOW_FALLBACK_TO_META = true;

export const PROVIDER_VALUES = Object.freeze([
    WHATSAPP_PROVIDERS.META_API,
    WHATSAPP_PROVIDERS.BAILEYS_WA,
]);

export const PROVIDER_SELECTABLE_VALUES = Object.freeze([
    WHATSAPP_PROVIDERS.AUTO,
    ...PROVIDER_VALUES,
]);

export const DEFAULT_TEMPLATE_SLUG = 'new-website-order-action-required';
