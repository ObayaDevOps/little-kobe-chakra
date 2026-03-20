import { sendOrderConfirmationWhatsApp } from '@/lib/whatsappNotification';
import { sendOrderConfirmationViaBaileys } from '@/lib/whatsapp/baileysProvider';
import {
    getWhatsAppProviderSettings,
    getWhatsAppTemplateBySlug,
} from '@/lib/whatsapp/settingsStore';
import {
    DEFAULT_PROVIDER,
    DEFAULT_TEMPLATE_SLUG,
    PROVIDER_SELECTABLE_VALUES,
    PROVIDER_VALUES,
    WHATSAPP_PROVIDERS,
} from '@/lib/whatsapp/constants';
import { DEFAULT_BAILEYS_TEMPLATE } from '@/lib/whatsapp/templateRenderer';

export const normalizeProviderChoice = (provider, fallback = DEFAULT_PROVIDER) => {
    if (typeof provider !== 'string') return fallback;
    const normalized = provider.trim().toLowerCase();
    return PROVIDER_SELECTABLE_VALUES.includes(normalized) ? normalized : fallback;
};

const resolveProvider = (requestedProvider, activeProvider) => {
    const normalizedRequest = normalizeProviderChoice(requestedProvider, WHATSAPP_PROVIDERS.AUTO);
    if (normalizedRequest !== WHATSAPP_PROVIDERS.AUTO) {
        return normalizedRequest;
    }
    const normalizedActive = normalizeProviderChoice(activeProvider, DEFAULT_PROVIDER);
    return PROVIDER_VALUES.includes(normalizedActive) ? normalizedActive : DEFAULT_PROVIDER;
};

const resolveBaileysTemplate = async (templateSlug) => {
    const slug = (templateSlug || '').toString().trim();
    try {
        if (slug) {
            const found = await getWhatsAppTemplateBySlug(slug, { onlyActive: true });
            if (found) {
                return found;
            }
        }

        const defaultFromDb = await getWhatsAppTemplateBySlug(DEFAULT_TEMPLATE_SLUG, { onlyActive: true });
        if (defaultFromDb) {
            return defaultFromDb;
        }
    } catch (error) {
        console.warn('Falling back to built-in Baileys template:', error.message);
    }
    return DEFAULT_BAILEYS_TEMPLATE;
};

const sendViaProvider = async ({
    provider,
    recipientPhoneNumber,
    orderDetails,
    isShopkeeper,
    templateSlug,
}) => {
    if (provider === WHATSAPP_PROVIDERS.BAILEYS_WA) {
        const template = await resolveBaileysTemplate(templateSlug);
        return sendOrderConfirmationViaBaileys({
            recipientPhoneNumber,
            orderDetails,
            isShopkeeper,
            template,
        });
    }

    const response = await sendOrderConfirmationWhatsApp({
        recipientPhoneNumber,
        orderDetails,
        isShopkeeper,
    });
    return {
        provider: WHATSAPP_PROVIDERS.META_API,
        messageId: response?.messages?.[0]?.id || null,
        raw: response,
    };
};

export async function sendOrderConfirmationWithProvider({
    recipientPhoneNumber,
    orderDetails,
    isShopkeeper = false,
    provider: requestedProvider,
    templateSlug,
}) {
    const settings = await getWhatsAppProviderSettings();
    const selectedProvider = resolveProvider(requestedProvider, settings.activeProvider);

    try {
        const result = await sendViaProvider({
            provider: selectedProvider,
            recipientPhoneNumber,
            orderDetails,
            isShopkeeper,
            templateSlug,
        });
        return {
            attemptedProvider: selectedProvider,
            providerUsed: result.provider || selectedProvider,
            fallbackUsed: false,
            settings,
            data: result.raw || result,
            messageId: result.messageId || null,
        };
    } catch (error) {
        const allowFallback = Boolean(settings.allowFallbackToMeta);
        if (
            selectedProvider === WHATSAPP_PROVIDERS.BAILEYS_WA &&
            allowFallback
        ) {
            const fallbackResult = await sendViaProvider({
                provider: WHATSAPP_PROVIDERS.META_API,
                recipientPhoneNumber,
                orderDetails,
                isShopkeeper,
                templateSlug,
            });
            return {
                attemptedProvider: selectedProvider,
                providerUsed: WHATSAPP_PROVIDERS.META_API,
                fallbackUsed: true,
                fallbackReason: error.message,
                settings,
                data: fallbackResult.raw || fallbackResult,
                messageId: fallbackResult.messageId || null,
            };
        }
        throw error;
    }
}
