import fs from 'fs'
import path from 'path'
import axios from 'axios'
import { getUser, saveUser, addXP, formatMoney } from '../../lib/rpg.js'

const DATA_PATH = path.join(process.cwd(), 'json', 'tebakgambar.json')
const CHAT_MODE = true
const CLOSE_THRESHOLD = 0.72
const MAX_CHAT_LEN = 40
const GAME_TIMEOUT_MS = 60000
const REWARD_XP = 500
const REWARD_MONEY = 10
const MAX_IMAGE = 5 * 1024 * 1024
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const log = (...a) => console.log('[TebakGambar]', ...a)

let questions = []
try {
    const parsed = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))
    if (!Array.isArray(parsed)) throw new Error('Root JSON bukan array')

    const seen = new Set()
    let skipped = 0
    for (const item of parsed) {
        if (!item?.img || item?.jawaban == null) { skipped++; continue }
        const img = String(item.img).trim()
        const jawaban = String(item.jawaban).trim()
        if (!img || !jawaban) { skipped++; continue }
        const key = img
        if (seen.has(key)) { skipped++; continue }
        seen.add(key)
        questions.push({ img, jawaban, deskripsi: item.deskripsi || '' })
    }
    log(`Loaded ${questions.length} soal (skip ${skipped}).`)
} catch (e) {
    console.error(`[TebakGambar] Gagal load ${DATA_PATH}: ${e.message}`)
}

const normalize = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9\s]/gi, ' ').replace(/\s+/g, ' ').trim()

const isCorrectAnswer = (input, answer) => normalize(input) === normalize(answer)

const isCloseAnswer = (input, answer) => {
    const inp = normalize(input)
    const ans = normalize(answer)
    if (inp.length <= 2) return false
    let matchCount = 0
    for (const ch of inp) if (ans.includes(ch)) matchCount++
    return (matchCount / Math.max(ans.length, 1)) >= CLOSE_THRESHOLD
}

const isHtml = (buf) => {
    if (!buf || buf.length < 16) return true
    const head = buf.slice(0, 512).toString('utf8').toLowerCase()
    return head.includes('<!doctype') || head.includes('<html') || head.includes('<body')
}

const isImageBuf = (buf) => {
    if (!buf || buf.length < 100) return false
    if (buf[0] === 0xFF && buf[1] === 0xD8) return true
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return true
    if (buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') return true
    if (buf.slice(0, 3).toString('ascii') === 'GIF') return true
    return false
}

const withTimeout = (promise, ms, label = 'op') => {
    let t
    const timeout = new Promise((_, rej) => {
        t = setTimeout(() => rej(new Error(`${label} timeout ${ms}ms`)), ms)
    })
    return Promise.race([promise, timeout]).finally(() => clearTimeout(t))
}

async function fetchImage(url) {
    if (!/^https?:\/\//i.test(url)) return null
    try {
        const res = await withTimeout(axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 20000,
            maxContentLength: MAX_IMAGE,
            maxRedirects: 5,
            headers: { 'User-Agent': UA, 'Referer': 'https://www.cademedia.com/' },
            validateStatus: () => true
        }), 23000, 'img')

        const buf = Buffer.from(res.data || [])
        if (res.status >= 400) return null
        if (buf.length < 1024) return null
        if (isHtml(buf)) return null
        if (!isImageBuf(buf)) return null
        return buf
    } catch (_) {
        return null
    }
}

if (!(global.__tebakgambarGames instanceof Map)) {
    global.__tebakgambarGames = new Map()
}
const games = global.__tebakgambarGames

const stopGame = (chat) => {
    const s = games.get(chat)
    if (!s) return null
    if (s.timeoutId) clearTimeout(s.timeoutId)
    games.delete(chat)
    return s
}

const sendGame = async (denn, m, state, text) => {
    const payload = { text: String(text) }
    try {
        const sent = await denn.sendMessage(m.chat, payload, { quoted: m })
        if (sent?.key?.id) state.msgIds.add(sent.key.id)
        return sent
    } catch (e1) {
        log('send quoted err:', e1.message)
    }
    try {
        const sent = await denn.sendMessage(m.chat, payload)
        if (sent?.key?.id) state.msgIds.add(sent.key.id)
        return sent
    } catch (e2) {
        log('send fallback err:', e2.message)
        return null
    }
}

const sendImage = async (denn, m, state, buffer, caption) => {
    const payload = { image: buffer, caption }
    try {
        const sent = await denn.sendMessage(m.chat, payload, { quoted: m })
        if (sent?.key?.id) state.msgIds.add(sent.key.id)
        return sent
    } catch (e1) {
        log('send img quoted err:', e1.message)
    }
    try {
        const sent = await denn.sendMessage(m.chat, payload)
        if (sent?.key?.id) state.msgIds.add(sent.key.id)
        return sent
    } catch (e2) {
        log('send img plain err:', e2.message)
        return null
    }
}

const grantReward = (jid) => {
    try {
        const user = getUser(jid)
        user.money = (user.money || 0) + REWARD_MONEY
        saveUser(jid, user)
        const r = addXP(jid, REWARD_XP)
        return { xp: REWARD_XP, money: REWARD_MONEY, levelsGained: r?.levelsGained || 0 }
    } catch (e) {
        log('grantReward err:', e.message)
        return { xp: 0, money: 0, levelsGained: 0 }
    }
}

const processAnswer = async (denn, m, state, input, source) => {
    log(`answer via ${source}: "${input}" (${(m.sender || '').split('@')[0]})`)

    if (isCorrectAnswer(input, state.jawaban)) {
        const reward = grantReward(m.sender)
        stopGame(m.chat)
        const desc = state.deskripsi ? `\n\n📝 *Penjelasan:* ${state.deskripsi}` : ''
        const lvl = reward.levelsGained > 0 ? `\n🆙 *Level up ${reward.levelsGained}x!*` : ''
        return sendGame(denn, m, state,
            `🎉 *BENAR!* 🎉\n\n` +
            `Jawaban: *${state.jawaban}*\n` +
            `+${reward.xp} XP · +${formatMoney(reward.money)}${lvl}${desc}`
        )
    }

    if (isCloseAnswer(input, state.jawaban)) {
        return sendGame(denn, m, state, `🔥 *Dikit lagi!*\n_Jawabanmu hampir benar._`)
    }

    return sendGame(denn, m, state, `❌ *Salah!* Coba lagi.`)
}

let hookedDenn = null
const ensureHook = (denn) => {
    if (!denn?.ev || typeof denn.ev.on !== 'function') return
    if (hookedDenn === denn) return

    if (global.__tebakgambarListener && hookedDenn?.ev?.off) {
        try { hookedDenn.ev.off('messages.upsert', global.__tebakgambarListener) } catch (_) {}
    }
    hookedDenn = denn

    const listener = async (update) => {
        try {
            if (update?.type !== 'notify') return
            const msgs = update.messages
            if (!Array.isArray(msgs) || !msgs.length) return
            const m = msgs[0]
            if (!m?.message) return
            if (m.key?.fromMe) return

            const chat = m.key?.remoteJid
            if (!chat) return

            const state = games.get(chat)
            if (!state) return
            if (state.expiresAt < Date.now()) return

            const msg = m.message
            let body = ''
            let ctx = null

            if (typeof msg.conversation === 'string') body = msg.conversation
            else if (msg.extendedTextMessage) {
                body = msg.extendedTextMessage.text || ''
                ctx = msg.extendedTextMessage.contextInfo
            } else if (msg.imageMessage) {
                body = msg.imageMessage.caption || ''
                ctx = msg.imageMessage.contextInfo
            } else if (msg.videoMessage) {
                body = msg.videoMessage.caption || ''
                ctx = msg.videoMessage.contextInfo
            }

            if (!body?.trim()) return

            const isCommand = /^[^a-zA-Z0-9\s]/.test(body)
            if (isCommand) return

            const quotedId = ctx?.stanzaId || ''
            const quotedSender = ctx?.participant || ''
            const botIds = [denn.user?.id, denn.user?.lid, denn.user?.phoneNumber]
                .filter(Boolean).map(x => String(x).split(':')[0].split('@')[0])
            const senderId = quotedSender ? String(quotedSender).split(':')[0].split('@')[0] : ''

            const idMatch = quotedId && state.msgIds.has(quotedId)
            const senderMatch = senderId && botIds.includes(senderId)
            const isReplyToGame = idMatch || senderMatch

            const isReplyToOther = ctx?.quotedMessage && !isReplyToGame

            if (!CHAT_MODE && !isReplyToGame) return
            if (CHAT_MODE && isReplyToOther) return
            if (CHAT_MODE && body.length > MAX_CHAT_LEN) return

            const mSender = m.key.participant || m.key.remoteJid
            const fakeM = {
                chat,
                sender: mSender,
                reply: async (txt) => denn.sendMessage(chat, { text: String(txt) }, { quoted: m })
            }

            await processAnswer(denn, fakeM, state, body.trim(), isReplyToGame ? 'reply' : 'chat')
        } catch (err) {
            log('listener err:', err.message)
        }
    }

    global.__tebakgambarListener = listener
    denn.ev.on('messages.upsert', listener)
    log('self-hook terpasang')
}

if (global.__tebakgambarListener && global.denn?.ev?.off) {
    try { global.denn.ev.off('messages.upsert', global.__tebakgambarListener) } catch (_) {}
    global.__tebakgambarListener = null
    hookedDenn = null
}

export default {
    command: ['tebakgambar'],
    category: 'game',
    execute: async (denn, m, { text, prefix }) => {
        ensureHook(denn)

        const chat = m.chat
        const input = (text || '').trim()
        const sub = input.toLowerCase()
        const state = games.get(chat)

        if (!input) {
            if (state) {
                return m.reply(
                    `⚠️ Masih ada sesi *TEBAK GAMBAR* berjalan!\n\n` +
                    `💬 Reply pesan soal atau ketik jawaban langsung.\n` +
                    `⏱️ Sisa: ${Math.max(0, Math.floor((state.expiresAt - Date.now()) / 1000))} detik\n` +
                    `Ketik \`${prefix}tebakgambar nyerah\` untuk mengakhiri.`
                )
            }

            if (!questions.length) {
                return m.reply('❌ Data soal kosong. Cek `json/tebakgambar.json`.')
            }

            const q = questions[Math.floor(Math.random() * questions.length)]

            const ns = {
                img: q.img,
                jawaban: q.jawaban,
                deskripsi: q.deskripsi,
                expiresAt: Date.now() + GAME_TIMEOUT_MS,
                timeoutId: null,
                msgIds: new Set()
            }
            games.set(chat, ns)

            ns.timeoutId = setTimeout(async () => {
                if (games.get(chat) !== ns) return
                stopGame(chat)
                try {
                    await denn.sendMessage(chat, {
                        text: `⏰ *WAKTU HABIS!*\n\nJawaban: *${ns.jawaban}*`
                    })
                } catch (_) {}
            }, GAME_TIMEOUT_MS)

            const caption =
                `🎮 *TEBAK GAMBAR*\n\n` +
                `📝 *Soal:* Tebak kata dari gambar ini\n\n` +
                `⏱️ *Waktu:* ${GAME_TIMEOUT_MS / 1000} detik\n` +
                `🎁 *Hadiah:* +${REWARD_XP} XP · +${formatMoney(REWARD_MONEY)}\n\n` +
                `💬 Reply pesan ini atau ketik jawaban langsung di chat\n` +
                `Ketik \`${prefix}tebakgambar nyerah\` untuk menyerah.`

            const imgBuf = await fetchImage(q.img)
            let sent = null

            if (imgBuf) {
                sent = await sendImage(denn, m, ns, imgBuf, caption)
            }

            if (!sent) {
                log('gambar gagal, fallback ke teks + link')
                sent = await sendGame(denn, m, ns,
                    `${caption}\n\n🔗 *Link gambar:* ${q.img}`
                )
            }

            if (!sent) {
                stopGame(chat)
                return m.reply('❌ Gagal mengirim soal.')
            }
            return
        }

        if (sub === 'nyerah' || sub === 'stop' || sub === 'end') {
            if (!state) return m.reply(`❌ Tidak ada game aktif.\nKetik \`${prefix}tebakgambar\` untuk mulai.`)
            stopGame(chat)
            return m.reply(`🏳️ *Kamu menyerah.*\n\nJawaban: *${state.jawaban}*`)
        }

        if (sub === 'status') {
            if (!state) return m.reply('❌ Tidak ada game aktif.')
            return m.reply(
                `⏱️ Sisa: ${Math.max(0, Math.floor((state.expiresAt - Date.now()) / 1000))} detik`
            )
        }

        if (!state) {
            return m.reply(`❌ Tidak ada game aktif.\nKetik \`${prefix}tebakgambar\` untuk mulai.`)
        }

        await processAnswer(denn, m, state, input, 'command')
    }
}