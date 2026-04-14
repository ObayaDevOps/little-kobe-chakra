import nodemailer from 'nodemailer';

let transporter = null;

const getTransporter = () => {
    if (transporter) return transporter;

    const { SMTP_USER, SMTP_PASSWORD } = process.env;
    if (!SMTP_USER || !SMTP_PASSWORD) {
        throw new Error('SMTP credentials are not configured. Set SMTP_USER and SMTP_PASSWORD.');
    }

    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number.parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASSWORD
        }
    });

    return transporter;
};

const parseRecipients = (recipients) => recipients
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

export const sendAlertEmail = async ({ subject, html, text }) => {
    const recipients = process.env.HEALTHCHECK_ALERT_RECIPIENTS
        || process.env.ALERT_RECIPIENTS
        || process.env.RECIPIENT_ADDRESS;

    if (!recipients) {
        throw new Error('No alert recipients configured. Set HEALTHCHECK_ALERT_RECIPIENTS.');
    }

    const to = parseRecipients(recipients);
    if (to.length === 0) {
        throw new Error('Alert recipients list is empty.');
    }

    const from = process.env.HEALTHCHECK_ALERT_SENDER
        || process.env.SMTP_FROM
        || process.env.SMTP_USER;

    if (!from) {
        throw new Error('No alert sender configured. Set HEALTHCHECK_ALERT_SENDER or SMTP_FROM.');
    }

    const transporterInstance = getTransporter();
    await transporterInstance.sendMail({
        from,
        to,
        subject,
        text,
        html
    });
};

export const sendLowStockAlertEmail = async ({ itemName, quantity, minStockLevel }) => {
    const recipient = process.env.LOW_STOCK_ALERT_EMAIL;
    if (!recipient) {
        throw new Error('LOW_STOCK_ALERT_EMAIL is not configured.');
    }

    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    if (!from) {
        throw new Error('No sender configured. Set SMTP_FROM or SMTP_USER.');
    }

    const subject = `Low Stock Alert for Item: ${itemName}`;

    const text = [
        `Low stock alert for: ${itemName}`,
        `Current quantity: ${quantity}`,
        `Minimum stock level: ${minStockLevel}`,
        '',
        'Please restock this item as soon as possible.'
    ].join('\n');

    const html = `
        <h2 style="color:#c0392b;">Low Stock Alert</h2>
        <p>The following item has reached or fallen below its minimum stock level:</p>
        <table style="border-collapse:collapse;margin-top:12px;">
            <tr>
                <td style="padding:6px 16px 6px 0;font-weight:bold;">Item</td>
                <td style="padding:6px 0;">${itemName}</td>
            </tr>
            <tr>
                <td style="padding:6px 16px 6px 0;font-weight:bold;">Current Quantity</td>
                <td style="padding:6px 0;color:#c0392b;font-weight:bold;">${quantity}</td>
            </tr>
            <tr>
                <td style="padding:6px 16px 6px 0;font-weight:bold;">Minimum Stock Level</td>
                <td style="padding:6px 0;">${minStockLevel}</td>
            </tr>
        </table>
        <p style="margin-top:16px;">Please restock this item as soon as possible.</p>
    `;

    const transporterInstance = getTransporter();
    await transporterInstance.sendMail({ from, to: recipient, subject, text, html });
};

export const sendHealthAlertEmail = async ({ supabase, whatsapp, triggeredAt }) => {
    const subject = '[Alert] Daily health check detected an issue';

    const formatSection = (label, result) => {
        if (!result) return `${label}: Not run`;
        if (result.ok) return `${label}: OK (latency ${result.latencyMs ?? 'n/a'} ms)`;
        const message = result.error?.message || 'Unknown error';
        return `${label}: ERROR - ${message}`;
    };

    const text = [
        'Daily health check detected a failure:',
        `Triggered at: ${triggeredAt}`,
        formatSection('Supabase', supabase),
        formatSection('WhatsApp', whatsapp),
        '',
        'Full payload:',
        JSON.stringify({ supabase, whatsapp }, null, 2)
    ].join('\n');

    const html = `
        <h1>Daily health check failed</h1>
        <p><strong>Triggered at:</strong> ${triggeredAt}</p>
        <ul>
            <li><strong>Supabase:</strong> ${supabase?.ok ? `OK (latency ${supabase.latencyMs ?? 'n/a'} ms)` : `ERROR - ${supabase?.error?.message || 'Unknown error'}`}</li>
            <li><strong>WhatsApp:</strong> ${whatsapp?.ok ? `OK (latency ${whatsapp.latencyMs ?? 'n/a'} ms)` : `ERROR - ${whatsapp?.error?.message || 'Unknown error'}`}</li>
        </ul>
        <h2>Raw payload</h2>
        <pre style="background:#f7f7f7;padding:12px;border-radius:6px;white-space:pre-wrap;">${JSON.stringify({ supabase, whatsapp }, null, 2)}</pre>
    `;

    await sendAlertEmail({ subject, text, html });
};
