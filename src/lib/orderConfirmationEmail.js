import nodemailer from 'nodemailer';

const formatCurrency = (amount, currency = 'UGX') => {
    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount)) return 'N/A';
    try {
        return new Intl.NumberFormat('en-UG', { style: 'currency', currency }).format(numericAmount);
    } catch (error) {
        return `${currency} ${numericAmount.toFixed(2)}`;
    }
};

const generateItemsTable = (items, currency) => {
    if (!Array.isArray(items)) {
        return '<p><i>Error: Could not display item details.</i></p>';
    }

    let tableHTML = `
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: sans-serif; border-color: #cccccc;">
            <thead style="background-color: #f2f2f2;">
                <tr>
                    <th style="text-align: left; border-bottom: 2px solid #dddddd;">Product</th>
                    <th style="text-align: center; border-bottom: 2px solid #dddddd;">Quantity</th>
                    <th style="text-align: right; border-bottom: 2px solid #dddddd;">Price/Item</th>
                    <th style="text-align: right; border-bottom: 2px solid #dddddd;">Subtotal</th>
                </tr>
            </thead>
            <tbody>
    `;

    items.forEach((item) => {
        const price = item.price ?? 0;
        const quantity = item.quantity ?? 0;
        const subtotal = price * quantity;
        tableHTML += `
            <tr>
                <td style="border-bottom: 1px solid #dddddd;">${item.name || 'N/A'}</td>
                <td style="text-align: center; border-bottom: 1px solid #dddddd;">${quantity}</td>
                <td style="text-align: right; border-bottom: 1px solid #dddddd;">${formatCurrency(price, currency)}</td>
                <td style="text-align: right; border-bottom: 1px solid #dddddd;">${formatCurrency(subtotal, currency)}</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;
    return tableHTML;
};

const getTransporter = () => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
        throw new Error('Email server configuration error: SMTP_USER/SMTP_PASSWORD missing.');
    }
    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
    });
};

const normalizeOrderDetails = (orderDetails) => {
    if (!orderDetails) {
        throw new Error('Missing order details.');
    }
    if (!orderDetails.items || !orderDetails.delivery_address || !orderDetails.totalAmount || !orderDetails.currency) {
        throw new Error('Incomplete order details provided.');
    }

    const deliveryAddress = orderDetails.delivery_address || {};
    const deliveryLocation = orderDetails.deliveryLocation || {};
    const latitude = deliveryLocation.latitude;
    const longitude = deliveryLocation.longitude;
    const googleMapsLink =
        typeof latitude === 'number' && typeof longitude === 'number'
            ? `https://www.google.com/maps?q=${latitude},${longitude}`
            : '';

    return {
        items: orderDetails.items,
        totalAmount: orderDetails.totalAmount,
        currency: orderDetails.currency,
        deliveryAddress,
        confirmationCode: orderDetails.confirmationCode,
        merchantReference: orderDetails.merchantReference,
        googleMapsLink,
    };
};

const buildSharedHtml = ({ introTitle, introText, details }) => {
    const { items, totalAmount, currency, deliveryAddress, confirmationCode, merchantReference, googleMapsLink } = details;
    const firstName = deliveryAddress?.first_name || '';
    const lastName = deliveryAddress?.last_name || '';
    const email = deliveryAddress?.email_address || '';
    const phone = deliveryAddress?.phone_number || '';
    const addressLine1 = deliveryAddress?.line_1 || '';
    const city = deliveryAddress?.city || '';
    const countryCode = deliveryAddress?.country_code || '';
    const itemsTable = generateItemsTable(items, currency);
    const formattedTotal = formatCurrency(totalAmount, currency);

    return `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h1 style="color: #333;">${introTitle}</h1>
            <p>${introText}</p>
            <hr style="border: none; border-top: 1px solid #eee;">

            <h2>Order Summary</h2>
            <p><strong>Order Reference:</strong> ${merchantReference || 'N/A'}</p>
            <p><strong>Pesapal Confirmation:</strong> ${confirmationCode || 'N/A'}</p>
            <p><strong>Order Total:</strong> <strong style="font-size: 1.1em;">${formattedTotal}</strong></p>
            <hr style="border: none; border-top: 1px solid #eee;">

            <h2>Delivery Details</h2>
            <p><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> ${email || 'N/A'}</p>
            <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
            <p><strong>Address:</strong> ${addressLine1 || 'N/A'}</p>
            <p><strong>City:</strong> ${city || 'N/A'} ${countryCode ? `(${countryCode})` : ''}</p>
            ${
                googleMapsLink
                    ? `<p><strong>Map Location:</strong> <a href="${googleMapsLink}" target="_blank" style="color: #007bff; text-decoration: none;">View on Google Maps</a></p>`
                    : ''
            }
            <hr style="border: none; border-top: 1px solid #eee;">

            <h2>Order Items</h2>
            ${itemsTable}
            <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;">

            <p style="font-size: 0.9em; color: #777;">This is an automated notification regarding order reference ${merchantReference || 'N/A'}.</p>
        </div>
    `;
};

export async function sendShopkeeperOrderConfirmationEmail(orderDetails) {
    const recipient = process.env.RECIPIENT_ADDRESS;
    if (!recipient) {
        throw new Error('Email server configuration error: RECIPIENT_ADDRESS missing.');
    }

    const details = normalizeOrderDetails(orderDetails);
    const transporter = getTransporter();
    const replyTo = details.deliveryAddress?.email_address || undefined;
    const subject = `✅ New Order Received - Ref: ${details.merchantReference || 'N/A'}`;
    const html = buildSharedHtml({
        introTitle: 'New Order Received!',
        introText: 'A new order has been successfully placed and payment verified.',
        details,
    });

    return transporter.sendMail({
        from: `"Little Kobe Orders" <${process.env.SMTP_USER}>`,
        to: recipient,
        replyTo,
        subject,
        html,
    });
}

export async function sendCustomerOrderConfirmationEmail(orderDetails) {
    const details = normalizeOrderDetails(orderDetails);
    const customerTo = details.deliveryAddress?.email_address;
    if (!customerTo) {
        throw new Error('Customer email address is missing.');
    }

    const transporter = getTransporter();
    const subject = `✅ Thanks for your order - Ref: ${details.merchantReference || 'N/A'}`;
    const html = buildSharedHtml({
        introTitle: 'Order Received!',
        introText: 'Your order has been successfully placed and payment verified.',
        details,
    });

    return transporter.sendMail({
        from: `"Little Kobe Orders" <${process.env.SMTP_USER}>`,
        to: customerTo,
        replyTo: customerTo,
        subject,
        html,
    });
}
