import { DEFAULT_TEMPLATE_SLUG, WHATSAPP_PROVIDERS } from '@/lib/whatsapp/constants';

const toText = (value, fallback = '') => {
    if (value === null || value === undefined) return fallback;
    return String(value).trim() || fallback;
};

const toItemsLine = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
        return 'No items listed';
    }
    return items
        .map((item) => `${toText(item?.quantity, '1')} x ${toText(item?.name, 'Unnamed Item')}`)
        .join(', ');
};

export const DEFAULT_BAILEYS_TEMPLATE = Object.freeze({
    name: 'New Website Order - Action Required',
    slug: DEFAULT_TEMPLATE_SLUG,
    providerScope: WHATSAPP_PROVIDERS.BAILEYS_WA,
    bodyText: [
        'New Website Order - Action Required',
        '',
        'Customer name: {{customerName}}',
        'Item: {{itemsLine}}',
        'Delivery location: {{deliveryLocation}}',
        '',
        'Status: {{orderStatus}}',
        'Payment method: {{paymentMethod}}',
        '',
        'Please:',
        '- Confirm payment once received',
        '- Start order preparation immediately after payment',
        '- Allow approx. 30min for preparation',
        '- Inform management once the order is ready and when it is dispatched',
        '',
        'Delivery location: {{deliveryLocation}}',
        '',
        'The customer will be notified separately.',
        'For questions, contact the customer: {{customerPhone}}.',
    ].join('\n'),
});

export const buildTemplateVariables = ({ orderDetails = {}, isShopkeeper = false } = {}) => {
    const location = toText(
        orderDetails?.deliveryLocationText ||
        orderDetails?.delivery_address?.line_1 ||
        orderDetails?.delivery_address?.address ||
        orderDetails?.delivery_address?.city,
        'not specified'
    );

    const customerPhone = toText(
        orderDetails?.customerPhoneNumber ||
        orderDetails?.customer_phone ||
        orderDetails?.customer_phone_number,
        'not available'
    );

    return {
        customerName: toText(orderDetails?.customerName, 'Customer'),
        itemsLine: toItemsLine(orderDetails?.items),
        deliveryLocation: location,
        orderStatus: toText(orderDetails?.status, 'Payment pending / to be confirmed'),
        paymentMethod: toText(orderDetails?.paymentMethod || orderDetails?.payment_method, ''),
        customerPhone,
        merchantReference: toText(orderDetails?.merchantReference, 'order'),
        estimatedDelivery: toText(
            orderDetails?.estimatedDelivery,
            'Please allow around 30 minutes for preparation after payment'
        ),
        isShopkeeper: String(Boolean(isShopkeeper)),
    };
};

export const renderTemplateText = (bodyText, variables = {}) => {
    const template = toText(bodyText);
    if (!template) {
        return '';
    }
    return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => {
        const value = variables[key];
        return value === null || value === undefined ? '' : String(value);
    });
};

export const renderBaileysOrderMessage = ({
    template,
    orderDetails,
    isShopkeeper,
} = {}) => {
    const resolvedTemplate = template || DEFAULT_BAILEYS_TEMPLATE;
    const variables = buildTemplateVariables({ orderDetails, isShopkeeper });
    return {
        template: resolvedTemplate,
        variables,
        text: renderTemplateText(resolvedTemplate.bodyText, variables),
    };
};
