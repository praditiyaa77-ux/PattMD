import * as config from './settings.js';
Object.assign(global, config); 

import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, jidDecode } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import readline from 'readline';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { initDatabase } from './lib/database.js';
import { handler, pluginsReady } from './handler.js';

initDatabase();

await pluginsReady;

const cleanTmpFiles = () => {
  try {
    const files = fs.readdirSync(process.cwd());
    let count = 0;
    for (const file of files) {
      if (file.startsWith('tmp_')) {
        fs.unlinkSync(path.join(process.cwd(), file));
        count++;
      }
    }
    if (count > 0) console.log(chalk.yellow(`🧹 Membersihkan ${count} file temporary yang tertinggal.`));
  } catch (e) {}
};
cleanTmpFiles();

const question = (text) => new Promise((resolve) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question(text, (ans) => { rl.close(); resolve(ans); });
});
const usePairingCode = true;

async function startSesi() {
  const { state, saveCreds } = await useMultiFileAuthState('./session');
  const { version } = await fetchLatestBaileysVersion();

  const denn = makeWASocket({
    version,
    logger: pino({ level: 'silent' }), 
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    },
    browser: ['Ubuntu', 'Chrome', '110.0.0.0'],
    generateHighQualityLinkPreview: true,
    getMessage: async () => undefined,
    retryRequestDelayMs: 500,
    maxMsgRetryCount: 5
  })

  denn.decodeJid = (jid) => {
    if (!jid) return jid
    if (/:\d+@/gi.test(jid)) {
      const decode = jidDecode(jid) || {}
      return decode.user && decode.server ? `${decode.user}@${decode.server}` : jid
    }
    return jid
  }

  const sentMessages = new Set()
  const _originalSendMessage = denn.sendMessage.bind(denn)
  
  denn.sendMessage = async (jid, content, options = {}) => {
    try {
      const res = await _originalSendMessage(jid, content, options)
      if (res && res.key && res.key.id) {
        sentMessages.add(res.key.id)
        setTimeout(() => sentMessages.delete(res.key.id), 5 * 60 * 1000) 
      }
      return res
    } catch (e1) {
      try {
        const res = await _originalSendMessage(jid, content, { ...options, quoted: undefined })
        if (res && res.key && res.key.id) {
          sentMessages.add(res.key.id)
          setTimeout(() => sentMessages.delete(res.key.id), 5 * 60 * 1000)
        }
        return res
      } catch (e2) {
        throw e2
      }
    }
  }

  if (usePairingCode && !denn.authState.creds.registered) {
    const phoneNumber = await question(chalk.blue.bold('Masukan Nomor WhatsApp :\n'))
    await new Promise(r => setTimeout(r, 3000))
    const code = await denn.requestPairingCode(phoneNumber.replace(/[^0-9]/g, ''), "DENNCODE")
    console.log(`${chalk.blue.bold('Kode Pairing')} : ${chalk.white.bold(code)}`)
  }

  denn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
      console.log(chalk.red('Koneksi terputus, alasan:'), reason)
      
      if (reason === DisconnectReason.loggedOut || reason === DisconnectReason.badSession) {
        fs.rmSync('./session', { recursive: true, force: true })
        console.log(chalk.yellow('Session dihapus. Jalankan ulang bot untuk pairing baru.'))
        process.exit(1)
      } else {
        setTimeout(startSesi, 3000)
      }
    } else if (connection === 'open') {
      console.log(chalk.green.bold('\n✅ BERHASIL TERHUBUNG KE WHATSAPP'))
      console.log(chalk.cyan('Bot JID:'), denn.user?.id)

    }
  })

  denn.ev.on('creds.update', saveCreds)

  const processMessage = async (m) => {

      if (!m.message) return 
      if (m.messageStubType === 1) return 
      
      const messageKeys = Object.keys(m.message).filter(k => k !== 'senderKeyDistributionMessage' && k !== 'messageContextInfo')
      if (messageKeys.length === 0) return

      if (m.key.remoteJid === 'status@broadcast') {
        const senderJid = m.key.participant || m.key.remoteJidAlt || m.key.remoteJid;
        const namaKontak = m.pushName || senderJid.split('@')[0];
        
        const waktu = new Date().toLocaleString('id-ID', { 
          timeZone: 'Asia/Jakarta',
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
          hour: '2-digit', minute: '2-digit', second: '2-digit' 
        });

        if (global.autoreadsw) {
          try {
            await denn.readMessages([m.key])
            console.log(chalk.green(`\n📖 Story Dibaca (${namaKontak})`))
            console.log(chalk.gray(`   Waktu: ${waktu} WIB`))
          } catch (e) {}
        }
        if (global.autolikesw) {
          try {
            const emojis = ['😆', '🔥', '💯', '😂', '😮', '😢', '👍']
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)]
            await denn.sendMessage('status@broadcast', { react: { text: randomEmoji, key: m.key } }, { statusJidList: [senderJid] })
            console.log(chalk.green(`\n💖 Story Di-like (${namaKontak}) ${randomEmoji}`))
            console.log(chalk.gray(`   Waktu: ${waktu} WIB`))
          } catch (e) {}
        }
        return
      }

      if (m.key.id && sentMessages.has(m.key.id)) return

      await handler(denn, m)
  }

  denn.ev.on('messages.upsert', async (chatUpdate) => {
    if (chatUpdate.type !== 'notify') return
    for (const m of chatUpdate.messages) {
      try {
        await processMessage(m)
      } catch (err) {
        if (!err?.message?.includes('Bad MAC')) {
          console.log(chalk.red('❌ Error di messages.upsert:'), err?.message || err)
        }
      }
    }
  })

  return denn
}

startSesi()
process.on('uncaughtException', (err) => {
  if (!err.message.includes('Bad MAC')) console.log(chalk.red('Caught exception:'), err?.message || err)
})
process.on('unhandledRejection', (err) => {
  if (!err?.message?.includes('Bad MAC')) console.log(chalk.red('Unhandled Rejection:'), err?.message || err)
})