import express from 'express';
import fs from 'fs';
import pino from 'pino';
import { makeWASocket, useMultiFileAuthState, delay, makeCacheableSignalKeyStore, Browsers, jidNormalizedUser } from '@whiskeysockets/baileys';
import { upload } from './mega.js';

const router = express.Router();

function removeFile(FilePath) {
    try {
        if (!fs.existsSync(FilePath)) return false;
        fs.rmSync(FilePath, { recursive: true, force: true });
    } catch (e) {
        console.error('Error removing file:', e);
    }
}

router.get('/', async (req, res) => {
    let num = req.query.number;
    let dirs = './' + (num || `session`);
    
   
    await removeFile(dirs);
    
    async function initiateSession() {
        const { state, saveCreds } = await useMultiFileAuthState(dirs);

        try {
            let SUPUNMDInc = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                browser: ["Ubuntu", "Chrome", "20.0.04"],
            });

            if (!SUPUNMDInc.authState.creds.registered) {
                await delay(2000);
                num = num.replace(/[^0-9]/g, '');
                const code = await SUPUNMDInc.requestPairingCode(num);
                if (!res.headersSent) {
                    console.log({ num, code });
                    await res.send({ code });
                }
            }

            SUPUNMDInc.ev.on('creds.update', saveCreds);
            SUPUNMDInc.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection === "open") {
                    await delay(10000);
                    const sessionGlobal = fs.readFileSync(dirs + '/creds.json');

                  
                    function generateRandomId(length = 6, numberLength = 4) {
                        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                        let result = '';
                        for (let i = 0; i < length; i++) {
                            result += characters.charAt(Math.floor(Math.random() * characters.length));
                        }
                        const number = Math.floor(Math.random() * Math.pow(10, numberLength));
                        return `${result}${number}`;
                    }

              
                    const megaUrl = await upload(fs.createReadStream(`${dirs}/creds.json`), `${generateRandomId()}.json`);
                    let stringSession = megaUrl.replace('https://mega.nz/file/', ''); // Extract session ID from URL
                    stringSession = 'CYBER-FEEDOM=' + stringSession;  // ඔයාගේ session id එකට ඉස්සරහින් යන්න ඕන එක උදා- 𝐒𝐔𝐋𝐀-𝐌𝐃=wyd1nJIQ#oxu9XAWC09MfWRLHm8fxFVXWfgc8nWiEZXRvtaYU6Ds

                  
                    const userJid = jidNormalizedUser(num + '@s.whatsapp.net');
                    await SUPUNMDInc.sendMessage(userJid, { text: stringSession });

                    // ඔයාට ඕන මැසේජ් එක දාන්න
                    await SUPUNMDInc.sendMessage(userJid, { text: "CYBER-FEEDOM= කියන කොටස අයින් කරලා id එක විතරක් use කරන්න" });
                    
                    // Clean up session after use
                    await delay(100);
                    removeFile(dirs);
                    process.exit(0);
                } else if (connection === 'close' && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode !== 401) {
                    console.log('Connection closed unexpectedly:', lastDisconnect.error);
                    await delay(10000);
                    initiateSession(); // Retry session initiation if needed
                }
            });
        } catch (err) {
            console.error('Error initializing session:', err);
            if (!res.headersSent) {
                res.status(503).send({ code: 'Service Unavailable' });
            }
        }
    }

    await initiateSession();
});

process.on('uncaughtException', (err) => {
    console.log('Caught exception: ' + err);
});

export default router;
