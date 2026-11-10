import axios from 'axios'
import { getUser, saveUser, addXP, formatMoney } from '../../lib/rpg.js'

const CHAT_MODE = true
const CLOSE_THRESHOLD = 0.72
const MAX_CHAT_LEN = 40
const GAME_TIMEOUT_MS = 60000
const REWARD_XP = 500
const REWARD_MONEY = 10

const WEB_BASE = () => global.web || global.jereBaseUrl || 'https://api.jerexd.my.id'
const API_KEY = () => global.apikey?.jereapi || global.jereApiKey || ''

const log = (...a) => console.log('[AsahOtak]', ...a)

const isValidUrl = (u) => typeof u === 'string' && /^https?:\/\//i.test(u)

const isHtml = (buf) => {
    if (!buf || buf.length < 16) return true
    const head = buf.slice(0, 512).toString('utf8').toLowerCase()
    return head.includes('<!doctype') || head.includes('<html') || head.includes('<body')
}

const withTimeout = (promise, ms, label = 'op') => {
    let t
    const timeout = new Promise((_, rej) => {
        t = setTimeout(() => rej(new Error(`${label} timeout ${ms}ms`)), ms)
    })
    return Promise.race([promise, timeout]).finally(() => clearTimeout(t))
}

const normalize = (s) => String(s ?? '').toLowerCase().replace(/\s+/g, ' ').trim()

const answerArray = (raw) => {
    if (Array.isArray(raw)) return raw.map(a => normalize(a)).filter(Boolean)
    if (raw == null) return []
    return [normalize(raw)]
}

const isCorrectAnswer = (input, answers) => {
    const inp = normalize(input)
    if (!inp) return false
    return answers.some(a => a === inp)
}

const isCloseAnswer = (input, answers) => {
    const inp = normalize(input)
    if (inp.length <= 2) return false
    for (const a of answers) {
        let matchCount = 0
        for (const ch of inp) if (a.includes(ch)) matchCount++
        if ((matchCount / Math.max(a.length, 1)) >= CLOSE_THRESHOLD) return true
    }
    return false
}

if (!(global.__asahotakGames instanceof Map)) {
    global.__asahotakGames = new Map()
}
const games = global.__asahotakGames

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
        return {
            xp: REWARD_XP,
            money: REWARD_MONEY,
            levelsGained: r?.levelsGained || 0
        }
    } catch (e) {
        log('grantReward err:', e.message)
        return { xp: 0, money: 0, levelsGained: 0 }
    }
}

const formatAnswerList = (answers) => answers.length > 1 ? answers.join(' / ') : answers[0]

const processAnswer = async (denn, m, state, input, source) => {
    log(`answer via ${source}: "${input}" (${(m.sender || '').split('@')[0]})`)

    if (isCorrectAnswer(input, state.jawaban)) {
        const reward = grantReward(m.sender)
        stopGame(m.chat)
        const desc = state.deskripsi ? `\n\n📝 *Penjelasan:* ${state.deskripsi}` : ''
        const lvl = reward.levelsGained > 0 ? `\n🆙 *Level up ${reward.levelsGained}x!*` : ''
        return sendGame(denn, m, state,
            `🎉 *BENAR!* 🎉\n\n` +
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

    if (global.__asahotakListener && hookedDenn?.ev?.off) {
        try { hookedDenn.ev.off('messages.upsert', global.__asahotakListener) } catch (_) {}
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

    global.__asahotakListener = listener
    denn.ev.on('messages.upsert', listener)
    log('self-hook terpasang')
}

if (global.__asahotakListener && global.denn?.ev?.off) {
    try { global.denn.ev.off('messages.upsert', global.__asahotakListener) } catch (_) {}
    global.__asahotakListener = null
    hookedDenn = null
}

async function fetchQuestion() {
    const key = API_KEY()
    if (!key) throw new Error('API key kosong. Set global.jereApiKey di settings.js')

    const res = await withTimeout(axios.get(`${WEB_BASE()}/api/game/asahotak`, {
        params: { apikey: key },
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0' },
        validateStatus: () => true
    }), 18000, 'asahotak-api')

    if (res.status >= 400) throw new Error(`HTTP ${res.status}`)
    if (!res.data?.status) throw new Error(res.data?.message || 'Gagal ambil soal')
    if (!res.data.result) throw new Error('Response tanpa result')

    const p = res.data.result
    const soal = p.soal || p.pertanyaan || p.str || p.deskripsi || p.caption
    const jawabanRaw = p.jawaban !== undefined ? p.jawaban : (p.result !== undefined ? p.result : (p.nama || p.name || p.title))
    if (!soal || jawabanRaw == null) throw new Error('Soal/jawaban tidak valid')

    return {
        soal: String(soal).trim(),
        jawaban: answerArray(jawabanRaw),
        deskripsi: p.deskripsi || '',
        clue: p.bantuan || p.clue || p.tipe || '',
        media: p.img || p.image || p.gambar || p.link || p.audio || p.url || null
    }
}

async function fetchMediaBuffer(url) {
    if (!isValidUrl(url)) return null
    try {
        const res = await withTimeout(axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 15000,
            maxContentLength: 15 * 1024 * 1024,
            headers: { 'User-Agent': 'Mozilla/5.0' },
            validateStatus: () => true
        }), 18000, 'media')
        const buf = Buffer.from(res.data || [])
        if (res.status >= 400 || buf.length < 1024 || isHtml(buf)) return null
        const isAudio = /\.(mp3|m4a|ogg|opus)(\?|$)/i.test(url) || (res.headers['content-type'] || '').startsWith('audio')
        return { buffer: buf, kind: isAudio ? 'audio' : 'image' }
    } catch (_) {
        return null
    }
}

export default {
    command: ['asahotak'],
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
                    `⚠️ Masih ada sesi *ASAH OTAK* berjalan!\n\n` +
                    `📝 *Soal:* ${state.soal}\n\n` +
                    `💬 Reply pesan soal atau ketik jawaban langsung.\n` +
                    `⏱️ Sisa: ${Math.max(0, Math.floor((state.expiresAt - Date.now()) / 1000))} detik\n` +
                    `Ketik \`${prefix}asahotak nyerah\` untuk mengakhiri.`
                )
            }

            let q
            try {
                q = await fetchQuestion()
            } catch (e) {
                log('fetch soal err:', e.message)
                return m.reply(`❌ Gagal ambil soal: ${e.message}`)
            }

            const ns = {
                soal: q.soal,
                jawaban: q.jawaban,
                deskripsi: q.deskripsi,
                revealed: false,
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
                        text: `⏰ *WAKTU HABIS!*\n\nJawaban: *${formatAnswerList(ns.jawaban)}*`
                    })
                } catch (_) {}
            }, GAME_TIMEOUT_MS)

            let caption =
                `🎮 *ASAH OTAK*\n\n` +
                `📝 *Soal:* ${q.soal}\n`
            if (q.clue) caption += `💡 *Petunjuk:* ${q.clue}\n`
            caption +=
                `\n⏱️ *Waktu:* ${GAME_TIMEOUT_MS / 1000} detik\n` +
                `🎁 *Hadiah:* +${REWARD_XP} XP · +${formatMoney(REWARD_MONEY)}\n\n` +
                `💬 Reply pesan ini atau ketik jawaban langsung di chat\n` +
                `Ketik \`${prefix}asahotak nyerah\` untuk menyerah.`

            let sent
            if (q.media) {
                const media = await fetchMediaBuffer(q.media)
                if (media) {
                    try {
                        sent = media.kind === 'audio'
                            ? await denn.sendMessage(chat, {
                                audio: media.buffer,
                                mimetype: 'audio/mp4',
                                ptt: false,
                                caption
                            }, { quoted: m })
                            : await denn.sendMessage(chat, {
                                image: media.buffer,
                                caption
                            }, { quoted: m })
                        if (sent?.key?.id) ns.msgIds.add(sent.key.id)
                    } catch (e) {
                        log('send media err:', e.message)
                    }
                }
            }

            if (!sent) {
                sent = await sendGame(denn, m, ns, caption)
            } else {
                ns.msgIds.add(sent.key.id)
            }

            if (!sent) {
                stopGame(chat)
                return m.reply('❌ Gagal mengirim soal.')
            }

            return
        }

        if (sub === 'nyerah' || sub === 'stop' || sub === 'end') {
            if (!state) return m.reply(`❌ Tidak ada game aktif.\nKetik \`${prefix}asahotak\` untuk mulai.`)
            stopGame(chat)
            return m.reply(`🏳️ *Kamu menyerah.*\n\nJawaban: *${formatAnswerList(state.jawaban)}*`)
        }

        if (sub === 'status') {
            if (!state) return m.reply('❌ Tidak ada game aktif.')
            return m.reply(
                `📝 *Soal:* ${state.soal}\n` +
                `⏱️ Sisa: ${Math.max(0, Math.floor((state.expiresAt - Date.now()) / 1000))} detik`
            )
        }

        if (!state) {
            return m.reply(`❌ Tidak ada game aktif.\nKetik \`${prefix}asahotak\` untuk mulai.`)
        }

        await processAnswer(denn, m, state, input, 'command')
    }
}