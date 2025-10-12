const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');

const WA_AUTH_FILE = 'baileys_auth_info';
const RECONNECT_DELAY_MS = 5000;
let sock;
let isConnected = false;
let isConnecting = false;
const logger = pino({ level: 'silent' });

// Simple debounce helper
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Initialize and connect to WhatsApp
 */
async function connectToWhatsApp() {
    if (isConnecting) return;
    isConnecting = true;

    console.log('--- Initializing WhatsApp Connection ---');

    try {
        const { state, saveCreds } = await useMultiFileAuthState(WA_AUTH_FILE);
        const { version } = await fetchLatestBaileysVersion();

        // Debounced creds saver
        const debouncedSaveCreds = debounce(async () => {
            try {
                await saveCreds();
                console.log('💾 Credentials saved successfully.');
            } catch (e) {
                console.error('❌ Failed to save credentials:', e);
            }
        }, 1000);

        sock = makeWASocket({
            version,
            auth: state,
            logger,
            browser: ['RuralLinkAPI', 'Chrome', '1.0'],
        });

        // Handle connection updates
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log('📱 Scan the QR code below to connect WhatsApp:');
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'close') {
                isConnected = false;
                isConnecting = false;

                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

                console.warn(`⚠️ Connection closed (Code: ${statusCode}). Reconnect: ${shouldReconnect}`);
                if (shouldReconnect) {
                    console.log(`🔄 Attempting reconnect in ${RECONNECT_DELAY_MS / 1000}s...`);
                    setTimeout(async () => {
                        await connectToWhatsApp();
                    }, RECONNECT_DELAY_MS);
                } else {
                    console.error('🚪 Logged out. Delete auth files and re-scan QR.');
                }
            } else if (connection === 'open') {
                isConnected = true;
                isConnecting = false;
                console.log('✅ WhatsApp connection opened successfully!');
            }
        });

        // Save credentials when updated
        sock.ev.on('creds.update', debouncedSaveCreds);
    } catch (error) {
        isConnected = false;
        isConnecting = false;
        console.error('CRITICAL WA STARTUP ERROR:', error);
        setTimeout(connectToWhatsApp, RECONNECT_DELAY_MS);
    }
}

/**
 * Wait for WhatsApp socket to open before sending messages
 */
async function waitForSocketOpen(timeout = 15000) {
    if (isConnected) return;
    console.log('⏳ Waiting for WhatsApp connection...');

    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('WhatsApp connection timeout')), timeout);

        const listener = ({ connection }) => {
            if (connection === 'open') {
                clearTimeout(timer);
                sock.ev.off('connection.update', listener);
                resolve();
            }
        };

        sock.ev.on('connection.update', listener);
    });
}

/**
 * Send WhatsApp message to user
 */
async function sendWhatsapp(recipientId, messageText) {
    if (!sock) {
        console.error('❌ WhatsApp socket not initialized.');
        return false;
    }

    try {
        await waitForSocketOpen();

        const [result] = await sock.onWhatsApp(recipientId);

        if (result && result.exists) {
            await sock.sendMessage(recipientId, { text: messageText });
            console.log(`✅ Message sent to ${recipientId}`);
            return true;
        } else {
            console.warn(`⚠️ Recipient ${recipientId} is not a valid WhatsApp number.`);
            return false;
        }
    } catch (error) {
        console.error('🚫 Failed to send WhatsApp message:', error.message);
        return false;
    }
}

module.exports = {
    connectToWhatsApp,
    sendWhatsapp,
    getSocket: () => sock,
};
