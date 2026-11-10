import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import chalk from 'chalk';
import { getUser } from './lib/userdb.js'; // Import database pendaftaran

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const plugins = new Map();
global.plugins = plugins;

if (!(global.passiveListeners instanceof Map)) {
    global.passiveListeners = new Map();
}

export const loadPlugins = async (dir) => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
            await loadPlugins(fullPath);
        } else if (file.name.endsWith('.js')) {
            try {
                const pluginUrl = pathToFileURL(fullPath).href + `?update=${Date.now()}`;
                const module = await import(pluginUrl);
                const plugin = module.default;
                if (plugin && plugin.command) {
                    const cmds = Array.isArray(plugin.command) ? plugin.command : [plugin.command];
                    cmds.forEach(cmd => {
                        if (typeof cmd === 'string' && cmd.trim()) {
                            plugins.set(cmd.toLowerCase().trim(), plugin);
                        }
                    });
                }
            } catch (err) {
                console.error(chalk.red(`⚠️ Gagal load plugin: ${file.name}`), err.message);
            }
        }
    }
};

const initPlugins = async () => {
    await loadPlugins(path.join(__dirname, 'plugins'));
    console.log(chalk.yellow(`✅ Memuat ${plugins.size} fitur plugin (ESM Split).`));
};
export const pluginsReady = initPlugins();

global.reloadPlugins = async () => {
    plugins.clear();
    await loadPlugins(path.join(__dirname, 'plugins'));
    return plugins.size;
};

export const handler = async (denn, m) => {
    try {
        let messageKeys = Object.keys(m.message || {}).filter(key => 
            key !== 'senderKeyDistributionMessage' && key !== 'messageContextInfo'
        );
        if (messageKeys.length === 0) return;
        
        let type = messageKeys[0];
        if (type === 'ephemeralMessage' || type === 'viewOnceMessage' || type === 'viewOnceMessageV2' || type === 'viewOnceMessageV2Extension') {
            m.message = m.message[type].message;
            type = Object.keys(m.message)[0];
        }
        
        let rawJid = m.key.remoteJid || '';
        let chatJid = rawJid;
        let senderJid = m.key.participant || m.key.remoteJidAlt || rawJid;

        if (chatJid.endsWith('@newsletter')) return;

        m.chat = chatJid;
        m.sender = senderJid;
        m.isGroup = m.chat.endsWith('@g.us');
        m.mtype = type;

        const content = m.message[type];
        m.msg = content;

        const contextInfo = content?.contextInfo || {};
        m.mentionedJid = contextInfo.mentionedJid || [];
        if (Array.isArray(m.mentionedJid) === false) m.mentionedJid = [];

        if (contextInfo?.quotedMessage) {
            const quotedMsg = contextInfo.quotedMessage;
            const quotedType = Object.keys(quotedMsg)[0];
            m.quoted = {
                key: { 
                    remoteJid: m.chat, 
                    fromMe: false, 
                    id: contextInfo.stanzaId, 
                    participant: contextInfo.participant 
                },
                message: quotedMsg,
                mtype: quotedType,
                msg: quotedMsg[quotedType],
                sender: contextInfo.participant
            };
            m.quoted.text = typeof m.quoted.msg === 'string' 
                ? m.quoted.msg 
                : (m.quoted.msg?.text || m.quoted.msg?.caption || '');
        }

        m.reply = async (text, options = {}) => {
            if (global.autotyping) {
                try {
                    await denn.sendPresenceUpdate('composing', m.chat);
                    const delay = Math.min(String(text).length * 25, 2500);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } catch (_) {}
            }
            return await denn.sendMessage(m.chat, { text: String(text), ...options }, { quoted: m });
        };

        const body = m.mtype === 'conversation' ? m.message.conversation
            : m.mtype === 'imageMessage' ? (m.message.imageMessage?.caption || '')
            : m.mtype === 'videoMessage' ? (m.message.videoMessage?.caption || '')
            : m.mtype === 'extendedTextMessage' ? (m.message.extendedTextMessage?.text || '')
            : m.mtype === 'stickerMessage' ? (m.message.stickerMessage?.caption || '')
            : m.mtype === 'documentMessage' ? (m.message.documentMessage?.caption || '')
            : m.mtype === 'audioMessage' ? ''
            : m.mtype === 'buttonsResponseMessage' ? (m.message.buttonsResponseMessage?.selectedButtonId || '')
            : m.mtype === 'listResponseMessage' ? (m.message.listResponseMessage?.singleSelectReply?.selectedRowId || '')
            : m.mtype === 'templateButtonReplyMessage' ? (m.message.templateButtonReplyMessage?.selectedId || '')
            : m.mtype === 'interactiveResponseMessage' ? (m.message.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson || '')
            : '';

        if (!body || typeof body !== 'string') return;
        if (Array.isArray(global.db?.banned) && global.db.banned.includes(m.sender)) return;

        if (global.passiveListeners instanceof Map) {
            const passive = global.passiveListeners.get(m.chat);
            if (typeof passive === 'function') {
                try {
                    const consumed = await passive(denn, m, body);
                    if (consumed === true) return;
                } catch (err) {
                    console.error(chalk.red('[passiveListener]'), err.message);
                }
            }
        }

        const prefixMatch = body.match(/^[^a-zA-Z0-9\s]/);
        if (!prefixMatch) return;
        const prefix = prefixMatch[0];
        const args = body.slice(prefix.length).trim().split(/ +/);
        const command = args.shift()?.toLowerCase();
        if (!command) return;
        const text = args.join(' ');

        const ownerIds = [m.sender, m.key.participant, m.key.participantAlt, m.key.remoteJidAlt]
            .filter(Boolean)
            .map(j => String(j).split('@')[0].split(':')[0]);
        const isOwner = ownerIds.includes(String(global.owner)) || !!m.key.fromMe;
        
        let botNumber = '';
        try {
            botNumber = await denn.decodeJid(denn.user.id);
        } catch (_) {
            botNumber = denn.user?.id || '';
        }

        if (global.db && global.db.public === false && !isOwner) return;

        if (global.randomreact && command) {
            try {
                const emojis = ['🔥', '⚡', '👍', '😂', '✨', '💀', '🤖', '👐', '❤️', '😎'];
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                if (Math.random() < 0.35) {
                    await denn.sendMessage(m.chat, { react: { text: randomEmoji, key: m.key } });
                }
            } catch (_) {}
        }

        const cleanJid = (jid) => jid ? String(jid).split(':')[0].split('@')[0] : '';
        
        const checkAdmin = async () => {
            if (!m.isGroup) return { isAdmin: false, isBotAdmin: false };
            try {
                const metadata = await denn.groupMetadata(m.chat);
                const participants = metadata.participants || [];
                
                const botIdentities = new Set();
                if (denn.user?.id) botIdentities.add(cleanJid(denn.user.id));
                if (denn.user?.lid) botIdentities.add(cleanJid(denn.user.lid));
                if (denn.user?.phoneNumber) botIdentities.add(cleanJid(denn.user.phoneNumber));
                if (botNumber) botIdentities.add(cleanJid(botNumber));
                
                const senderIdentities = new Set();
                senderIdentities.add(cleanJid(m.sender));
                if (m.key?.participant) senderIdentities.add(cleanJid(m.key.participant));
                if (m.key?.participantAlt) senderIdentities.add(cleanJid(m.key.participantAlt));
                if (m.key?.participantPn) senderIdentities.add(cleanJid(m.key.participantPn));
                if (m.key?.remoteJidAlt) senderIdentities.add(cleanJid(m.key.remoteJidAlt));
                
                const matchIdentity = (p, identitySet) => {
                    const pIds = [
                        cleanJid(p.id),
                        p.lid ? cleanJid(p.lid) : null,
                        p.jid ? cleanJid(p.jid) : null,
                        p.phoneNumber ? cleanJid(p.phoneNumber) : null,
                    ].filter(Boolean);
                    return pIds.some(id => identitySet.has(id));
                };
                
                const senderPart = participants.find(p => matchIdentity(p, senderIdentities));
                const botPart = participants.find(p => matchIdentity(p, botIdentities));
                
                return { 
                    isAdmin: senderPart?.admin === 'admin' || senderPart?.admin === 'superadmin', 
                    isBotAdmin: botPart?.admin === 'admin' || botPart?.admin === 'superadmin' 
                };
            } catch (e) {
                console.error('[checkAdmin] Error:', e.message);
                return { isAdmin: false, isBotAdmin: false };
            }
        };

        const getTarget = () => {
            let target = m.mentionedJid?.[0] || 
                (m.quoted ? m.quoted.sender : null) || 
                (text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);
            return target || null;
        };

        const mime = (m.quoted?.msg || m.quoted)?.mimetype || '';
        const qmsg = (m.quoted?.msg || m.quoted);

        const plugin = plugins.get(command);
        if (plugin) {
            // ─── VALIDASI REGISTRASI ───
            const isRegistered = getUser(m.sender);
            const bypassCommands = ['daftar', 'register']; // Command yang boleh dipakai sebelum daftar

            if (!isRegistered && !bypassCommands.includes(command) && !isOwner) {
                return m.reply(
                    `⚠️ *AKSES DITOLAK*\n\n` +
                    `Kamu belum terdaftar sebagai pengguna bot ini.\n` +
                    `Silakan daftar terlebih dahulu dengan format:\n\n` +
                    `\`${prefix}daftar <nama> <umur>\`\n\n` +
                    `_Contoh:_\n\`${prefix}daftar Budi 20\``
                );
            }
            // ───────────────────────────

            console.log(
                chalk.white.bgCyan.bold(` ${global.namabot || 'Bot'} `), 
                chalk.blue.bold(`Pesan dari:`), 
                chalk.yellow(`${m.sender.split('@')[0]}`), 
                chalk.blue.bold(`| Command:`), 
                chalk.green(`${prefix}${command}`)
            );
            
            try {
                const execFn = plugin.execute || plugin.run || plugin.handler;
                if (typeof execFn === 'function') {
                    await execFn(denn, m, { args, text, prefix, command, isOwner, mime, qmsg, checkAdmin, getTarget, botNumber });
                }
            } catch (err) {
                console.error(chalk.red(`Error di plugin ${command}:`), err.message);
                try {
                    await m.reply(`❌ Terjadi error saat menjalankan fitur *${command}*.\n\n_Log Error:_\n${err.message}`);
                } catch (_) {}
            }
        }
    } catch (e) {
        if (e?.message && !e.message.includes('Bad MAC')) {
            console.log(chalk.red('❌ [handler.js] Error:'), e.message);
        }
    }
};