import axios from 'axios';

export function extractDeliveryLocationInfo(orderDetails = {}) {
    const deliveryAddress = orderDetails?.delivery_address;
    const deliveryLocation = orderDetails?.deliveryLocation;

    const addressParts = [];
    if (deliveryAddress) {
        const candidates = [
            deliveryAddress?.address,
            deliveryAddress?.line_1,
            deliveryAddress?.line_2,
            deliveryAddress?.line1,
            deliveryAddress?.line2,
            deliveryAddress?.city,
            deliveryAddress?.state,
            deliveryAddress?.country,
        ];
        candidates.forEach((part) => {
            if (part && typeof part === 'string') {
                const trimmed = part.trim();
                if (trimmed && !addressParts.includes(trimmed)) {
                    addressParts.push(trimmed);
                }
            }
        });
    }

    const hasLatLng =
        typeof deliveryLocation?.latitude === 'number' &&
        typeof deliveryLocation?.longitude === 'number';

    const fallbackAddress = addressParts.join(', ');
    const deliveryLocationText = orderDetails?.deliveryLocationText || fallbackAddress || '';

    let deliveryLocationUrl = '';
    if (orderDetails?.deliveryLocationUrl && typeof orderDetails.deliveryLocationUrl === 'string') {
        deliveryLocationUrl = orderDetails.deliveryLocationUrl.trim();
    } else if (hasLatLng) {
        const { latitude, longitude } = deliveryLocation;
        deliveryLocationUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    } else if (deliveryLocationText) {
        deliveryLocationUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(deliveryLocationText)}`;
    }

    return {
        deliveryLocationText: deliveryLocationText || 'not specified',
        deliveryLocationUrl,
    };
}

function requireWhatsAppConfig() {
    const apiVersion = process.env.WHATSAPP_API_VERSION;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!apiVersion || !phoneNumberId || !accessToken) {
        throw new Error('WhatsApp environment variables are not fully configured.');
    }

    return {
        apiVersion,
        phoneNumberId,
        accessToken,
    };
}

export function buildOrderConfirmationPayload({ recipientPhoneNumber, orderDetails, isShopkeeper }) {
    if (!recipientPhoneNumber || typeof recipientPhoneNumber !== 'string') {
        throw new Error('recipientPhoneNumber is required.');
    }
    if (!orderDetails || typeof orderDetails !== 'object') {
        throw new Error('orderDetails is required.');
    }

    const templateName = process.env.WHATSAPP_ORDER_TEMPLATE_NAME || 'order_management_1';
    const shopkeeperContact = process.env.SHOPKEEPER_WA_NUMBER || process.env.NEXT_PUBLIC_SHOPKEEPER_WA_NUMBER || 'Shopkeeper contact not set';
    const customerName = String(orderDetails?.customerName ?? 'Customer');
    const merchantReference = String(orderDetails?.merchantReference ?? 'order');
    const itemsList = String(
        orderDetails?.items?.map((item) => `${String(item?.quantity ?? 1)} ${String(item?.name ?? 'Unnamed Item')}`).join(', ') ??
            'No items listed'
    );
    const { deliveryLocationUrl } = extractDeliveryLocationInfo(orderDetails);
    const estimatedDelivery = String(
        orderDetails?.estimatedDelivery ??
            'Please allow 1 hour post-payment to prepare your order, and transport time, we will notify you when order is sent'
    );
    const contactInfo = String(isShopkeeper ? orderDetails?.customerPhoneNumber ?? 'Customer number not available' : shopkeeperContact);

    return {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipientPhoneNumber,
        type: 'template',
        template: {
            name: templateName,
            language: { code: 'en_US' },
            components: [
                {
                    type: 'body',
                    parameters: [
                        { type: 'text', text: customerName },
                        { type: 'text', text: merchantReference },
                        { type: 'text', text: itemsList },
                        { type: 'text', text: estimatedDelivery },
                        { type: 'text', text: deliveryLocationUrl || 'Location not specified' },
                        { type: 'text', text: contactInfo },
                    ],
                },
            ],
        },
    };
}

export async function sendOrderConfirmationWhatsApp({ recipientPhoneNumber, orderDetails, isShopkeeper }) {
    const { apiVersion, phoneNumberId, accessToken } = requireWhatsAppConfig();
    const whatsappApiUrl = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
    const payload = buildOrderConfirmationPayload({ recipientPhoneNumber, orderDetails, isShopkeeper });

    const response = await axios.post(whatsappApiUrl, payload, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response?.data?.messages?.length) {
        throw new Error('WhatsApp API did not return a message id.');
    }

    return response.data;
}
