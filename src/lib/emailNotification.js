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
