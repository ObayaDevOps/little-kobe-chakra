import fs from 'fs/promises';
import path from 'path';
import { renderBaileysOrderMessage } from '@/lib/whatsapp/templateRenderer';

const DEFAULT_TIMEOUT_MS = 25_000;

const normalizePhoneToJid = (recipientPhoneNumber) => {
    const digits = String(recipientPhoneNumber || '').replace(/\D/g, '');
    if (!digits) {
        throw new Error('A valid recipient phone number is required for Baileys.');
    }
    return `${digits}@s.whatsapp.net`;
};

const getAuthStatePath = () => {
    return process.env.WHATSAPP_BAILEYS_AUTH_STATE_PATH || '/tmp/baileys_auth_state';
};

const dynamicImportBaileys = async () => {
    try {
        return await import('@whiskeysockets/baileys');
    } catch (error) {
        throw new Error(
            `Baileys dependency is missing or failed to load: ${error.message}. Install @whiskeysockets/baileys first.`
        );
    }
};

const waitForSocketOpen = async (sock, timeoutMs = DEFAULT_TIMEOUT_MS) => {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error('Timed out waiting for Baileys socket to open.'));
        }, timeoutMs);

        const onConnectionUpdate = (update) => {
            const { connection, lastDisconnect } = update || {};
            if (connection === 'open') {
                cleanup();
                resolve({ connection, lastDisconnect });
                return;
            }
            if (connection === 'close') {
                const reason = lastDisconnect?.error?.message || 'Unknown disconnect reason';
                cleanup();
                reject(new Error(`Baileys socket closed before opening: ${reason}`));
            }
        };

        const cleanup = () => {
            clearTimeout(timeout);
            sock.ev.off('connection.update', onConnectionUpdate);
        };

        sock.ev.on('connection.update', onConnectionUpdate);
    });
};

const closeSocketQuietly = (sock) => {
    try {
        sock?.ws?.close();
    } catch (_error) {
        // Ignore close failures.
    }
};

export const getBaileysAuthStateSummary = async () => {
    const authStatePath = getAuthStatePath();
    const credsPath = path.join(authStatePath, 'creds.json');

    try {
        const stat = await fs.stat(credsPath);
        const contents = await fs.readFile(credsPath, 'utf8');
        const parsed = JSON.parse(contents);
        return {
            authStatePath,
            exists: true,
            credsFileMtime: stat.mtime.toISOString(),
            registered: Boolean(parsed?.registered),
            hasIdentity: Boolean(parsed?.me?.id),
            meId: parsed?.me?.id || null,
        };
    } catch (error) {
        if (error?.code === 'ENOENT') {
            return {
                authStatePath,
                exists: false,
                registered: false,
                hasIdentity: false,
                meId: null,
            };
        }
        throw error;
    }
};

export const checkBaileysHealth = async () => {
    const enabled = process.env.WHATSAPP_BAILEYS_ENABLED === 'true';
    try {
        const summary = await getBaileysAuthStateSummary();
        const status = summary.registered ? 'ready' : 'needs_linking';

        return {
            ok: enabled && summary.registered,
            enabled,
            status,
            auth: summary,
            guidance: summary.registered
                ? 'Baileys auth state is present.'
                : 'Baileys auth state missing or unregistered. Link a WhatsApp account first.',
        };
    } catch (error) {
        return {
            ok: false,
            enabled,
            status: 'error',
            error: {
                message: error.message,
            },
            guidance: 'Failed to inspect Baileys auth/session state.',
        };
    }
};

export const sendOrderConfirmationViaBaileys = async ({
    recipientPhoneNumber,
    orderDetails,
    isShopkeeper,
    template,
}) => {
    const enabled = process.env.WHATSAPP_BAILEYS_ENABLED === 'true';
    if (!enabled) {
        throw new Error('Baileys sending is disabled. Set WHATSAPP_BAILEYS_ENABLED=true.');
    }

    const authStatePath = getAuthStatePath();
    await fs.mkdir(authStatePath, { recursive: true });

    const baileys = await dynamicImportBaileys();
    const {
        default: makeWASocket,
        useMultiFileAuthState,
    } = baileys;

    const { state, saveCreds } = await useMultiFileAuthState(authStatePath);
    const jid = normalizePhoneToJid(recipientPhoneNumber);
    const rendered = renderBaileysOrderMessage({ template, orderDetails, isShopkeeper });
    const text = rendered.text?.trim();
    if (!text) {
        throw new Error('Resolved Baileys message is empty.');
    }

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        markOnlineOnConnect: false,
    });
    sock.ev.on('creds.update', saveCreds);

    try {
        await waitForSocketOpen(sock);
        const sentMessage = await sock.sendMessage(jid, { text });
        return {
            provider: 'baileys_wa',
            messageId: sentMessage?.key?.id || null,
            jid,
            templateName: rendered.template?.name || null,
            renderedText: text,
            raw: sentMessage,
        };
    } catch (error) {
        throw new Error(`Baileys send failed: ${error.message}`);
    } finally {
        closeSocketQuietly(sock);
    }
};
