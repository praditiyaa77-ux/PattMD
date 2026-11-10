import fs from 'fs'
import path from 'path'
import { getUser, saveUser, addXP, formatMoney } from '../../lib/rpg.js'

const DATA_PATH = path.join(process.cwd(), 'json', 'siapakahaku.json')
const CHAT_MODE = true
const CLOSE_THRESHOLD = 0.72
const MAX_CHAT_LEN = 40
const GAME_TIMEOUT_MS = 60000
const REWARD_XP = 500
const REWARD_MONEY = 10

const log = (...a) => console.log('[SiapakahAku]', ...a)

let questions = []
try {
    const parsed = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))
    if (!Array.isArray(parsed)) throw new Error('Root JSON bukan array')

    const seen = new Set()
    let skipped = 0
    for (const item of parsed) {
        if (!item?.soal || item?.jawaban == null) { skipped++; continue }
        const soal = String(item.soal).trim()
        const jawaban = String(item.jawaban).trim()
        if (!soal || !jawaban) { skipped++; continue }
        const key = soal.toLowerCase()
        if (seen.has(key)) { skipped++; continue }
        seen.add(key)
        questions.push({ soal, jawaban })
    }
    log(`Loaded ${questions.length} soal (skip ${skipped}).`)
} catch (e) {
    console.error(`[SiapakahAku] Gagal load ${DATA_PATH}: ${e.message}`)
}

const normalize = (s) => String(s ?? '').toLowerCase().replace(/\s+/g, ' ').trim()

const isCorrectAnswer = (input, answer) => normalize(input) === normalize(answer)

const isCloseAnswer = (input, answer) => {
    const inp = normalize(input)
    const ans = normalize(answer)
    if (inp.length <= 2) return false
    let matchCount = 0
    for (const ch of inp) if (ans.includes(ch)) matchCount++
    return (matchCount / Math.max(ans.length, 1)) >= CLOSE_THRESHOLD
}

if (!(global.__siapakahakuGames instanceof Map)) {
    global.__siapakahakuGames = new Map()
}
const games = global.__siapakahakuGames

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
        const lvl = reward.levelsGained > 0 ? `\n🆙 *Level up ${reward.levelsGained}x!*` : ''
        return sendGame(denn, m, state,
            `🎉 *BENAR!* 🎉\n\n` +
            `Jawaban: *${state.jawaban}*\n` +
            `+${reward.xp} XP · +${formatMoney(reward.money)}${lvl}`
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

    if (global.__siapakahakuListener && hookedDenn?.ev?.off) {
        try { hookedDenn.ev.off('messages.upsert', global.__siapakahakuListener) } catch (_) {}
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

    global.__siapakahakuListener = listener
    denn.ev.on('messages.upsert', listener)
    log('self-hook terpasang')
}

if (global.__siapakahakuListener && global.denn?.ev?.off) {
    try { global.denn.ev.off('messages.upsert', global.__siapakahakuListener) } catch (_) {}
    global.__siapakahakuListener = null
    hookedDenn = null
}

export default {
    command: ['siapakahaku'],
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
                    `⚠️ Masih ada sesi *SIAPAKAH AKU* berjalan!\n\n` +
                    `📝 *Soal:* ${state.soal}\n\n` +
                    `💬 Reply pesan soal atau ketik jawaban langsung.\n` +
                    `⏱️ Sisa: ${Math.max(0, Math.floor((state.expiresAt - Date.now()) / 1000))} detik\n` +
                    `Ketik \`${prefix}siapakahaku nyerah\` untuk mengakhiri.`
                )
            }

            if (!questions.length) {
                return m.reply('❌ Data soal kosong. Cek `json/siapakahaku.json`.')
            }

            const q = questions[Math.floor(Math.random() * questions.length)]

            const ns = {
                soal: q.soal,
                jawaban: q.jawaban,
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
                `🎮 *SIAPAKAH AKU*\n\n` +
                `📝 *Soal:* ${q.soal}\n\n` +
                `⏱️ *Waktu:* ${GAME_TIMEOUT_MS / 1000} detik\n` +
                `🎁 *Hadiah:* +${REWARD_XP} XP · +${formatMoney(REWARD_MONEY)}\n\n` +
                `💬 Reply pesan ini atau ketik jawaban langsung di chat\n` +
                `Ketik \`${prefix}siapakahaku nyerah\` untuk menyerah.`

            const sent = await sendGame(denn, m, ns, caption)
            if (!sent) {
                stopGame(chat)
                return m.reply('❌ Gagal mengirim soal.')
            }
            return
        }

        if (sub === 'nyerah' || sub === 'stop' || sub === 'end') {
            if (!state) return m.reply(`❌ Tidak ada game aktif.\nKetik \`${prefix}siapakahaku\` untuk mulai.`)
            stopGame(chat)
            return m.reply(`🏳️ *Kamu menyerah.*\n\nJawaban: *${state.jawaban}*`)
        }

        if (sub === 'status') {
            if (!state) return m.reply('❌ Tidak ada game aktif.')
            return m.reply(
                `📝 *Soal:* ${state.soal}\n` +
                `⏱️ Sisa: ${Math.max(0, Math.floor((state.expiresAt - Date.now()) / 1000))} detik`
            )
        }

        if (!state) {
            return m.reply(`❌ Tidak ada game aktif.\nKetik \`${prefix}siapakahaku\` untuk mulai.`)
        }

        await processAnswer(denn, m, state, input, 'command')
    }
}