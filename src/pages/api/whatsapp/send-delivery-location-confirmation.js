// pages/api/whatsapp/send-delivery-location-confirmation.js
import axios from 'axios';
import { extractDeliveryLocationInfo } from './send-order-confirmation';

export default async function handler(req, res) {
    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const whatsappApiUrl = `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!whatsappApiUrl || !accessToken || !process.env.WHATSAPP_PHONE_NUMBER_ID || !process.env.WHATSAPP_API_VERSION) {
        console.error("Missing WhatsApp environment variables");
        return res.status(500).json({ message: 'Server configuration error: WhatsApp environment variables not set.' });
    }

    const isTestMode = req.query.test === 'true';
    let recipientPhoneNumber;
    let orderDetails;
    let deliveryLocationUrl;
    let deliveryLocationText;
    let deliveryLocationButtonParam;
    let isShopkeeper = false;
    let customerName;
    let arrivalWindow;

    if (isTestMode) {
        console.log("--- Running WhatsApp delivery location send in TEST MODE ---");
        recipientPhoneNumber = req.query.testRecipient;
        isShopkeeper = req.query.isShopkeeperTest === 'true';

        const latitude = parseFloat(req.query.lat ?? '1.2921');
        const longitude = parseFloat(req.query.lng ?? '36.8219');
        orderDetails = {
            customerName: 'Test Customer',
            deliveryLocation: { latitude, longitude },
            deliveryLocationText: req.query.locationText || 'Test Address, Nairobi',
            estimatedDelivery: req.query.arrivalWindow || 'hour',
        };

        if (!recipientPhoneNumber) {
            console.error("Test mode requires 'testRecipient' query parameter.");
            return res.status(400).json({ message: "Test mode requires 'testRecipient' query parameter with a phone number." });
        }
    } else {
        if (req.method !== 'POST') {
            return res.status(405).json({ message: 'Method Not Allowed for non-test requests' });
        }

        ({
            recipientPhoneNumber,
            orderDetails,
            deliveryLocationUrl,
            deliveryLocationText,
            deliveryLocationButtonParam,
            isShopkeeper = false,
            customerName,
            arrivalWindow,
        } = req.body || {});

        if (!recipientPhoneNumber) {
            return res.status(400).json({ message: 'Missing recipientPhoneNumber in request body' });
        }

        if (!orderDetails && !deliveryLocationUrl && !deliveryLocationText) {
            return res.status(400).json({ message: 'Provide orderDetails or delivery location data in request body' });
        }
    }

    const locationInfo = extractDeliveryLocationInfo({
        ...(orderDetails || {}),
        deliveryLocationText,
        deliveryLocationUrl,
        deliveryLocationButtonParam,
    });

    const resolvedLocationUrl = deliveryLocationUrl || locationInfo.deliveryLocationUrl;
    const resolvedLocationText = deliveryLocationText || locationInfo.deliveryLocationText;
    const resolvedButtonParam = (deliveryLocationButtonParam || locationInfo.deliveryLocationButtonParam || '').toString().trim();
    const resolvedCustomerName = customerName || orderDetails?.customerName || (isShopkeeper ? '' : 'there');
    const resolvedArrivalWindow = arrivalWindow || orderDetails?.arrivalWindow || orderDetails?.estimatedDelivery || 'hour';

    const bodyCustomerName = (resolvedCustomerName || 'there').toString().trim() || 'there';
    const bodyArrivalWindow = (resolvedArrivalWindow || 'hour').toString().trim() || 'hour';

    if (!resolvedLocationUrl && (!resolvedLocationText || resolvedLocationText === 'not specified')) {
        console.error("Delivery location information is missing or incomplete.");
        return res.status(400).json({ message: 'Delivery location information is missing or incomplete.' });
    }

    if (!resolvedButtonParam) {
        console.error("Dynamic button parameter could not be resolved from the delivery location URL:", resolvedLocationUrl);
        return res.status(400).json({ message: 'Could not derive dynamic button parameter for the template.' });
    }

    const templateName = process.env.WHATSAPP_DELIVERY_LOCATION_TEMPLATE || 'delivery_location_google_maps';
    const templateLanguage = process.env.WHATSAPP_DELIVERY_LOCATION_TEMPLATE_LANG || 'en_US';

    const components = [
        {
            type: 'body',
            parameters: [
                { type: 'text', text: bodyCustomerName },
                { type: 'text', text: bodyArrivalWindow },
            ],
        },
        {
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [
                { type: 'text', text: resolvedButtonParam },
            ],
        },
    ];

    const whatsappPayload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipientPhoneNumber,
        type: "template",
        template: {
            name: templateName,
            language: {
                code: templateLanguage,
            },
            components,
        },
    };

    console.log("Sending WhatsApp delivery location payload:", JSON.stringify(whatsappPayload, null, 2));
    console.log("Resolved full map URL:", resolvedLocationUrl);
    console.log("Resolved button parameter:", resolvedButtonParam);

    try {
        const response = await axios.post(whatsappApiUrl, whatsappPayload, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        console.log("WhatsApp API response:", response.data);

        if (response.data.messages && response.data.messages.length > 0) {
            console.log("WhatsApp delivery location message sent successfully.");
            return res.status(200).json({ message: 'WhatsApp delivery location message sent successfully', data: response.data });
        }

        console.error("WhatsApp API did not return a success message:", response.data);
        return res.status(500).json({ message: 'Failed to send WhatsApp delivery location message', details: response.data });
    } catch (error) {
        console.error("Error sending WhatsApp delivery location message:", error.response?.data || error.message);
        return res.status(500).json({ message: 'Error sending WhatsApp delivery location message', error: error.response?.data || error.message });
    }
}
