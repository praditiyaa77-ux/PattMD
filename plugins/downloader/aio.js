import axios from 'axios'
import { aiodl } from '../../lib/scraper.js'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const LIMIT_VIDEO = 60 * 1024 * 1024
const LIMIT_IMAGE = 10 * 1024 * 1024
const LIMIT_AUDIO = 20 * 1024 * 1024
const LIMIT_DOC = 100 * 1024 * 1024
const MAX_FETCH = LIMIT_DOC + 20 * 1024 * 1024
const T_DL = 90000
const T_GLOBAL = 240000
const MAX_ITEMS = 10

const log = (...a) => console.log('[AIO]', ...a)

const isValidUrl = (u) => typeof u === 'string' && /^https?:\/\//i.test(u)

const isHtml = (buf) => {
    if (!buf || buf.length < 16) return true
    const head = buf.slice(0, 512).toString('utf8').toLowerCase()
    return head.includes('<!doctype') || head.includes('<html') || head.includes('<body')
}

const detectKind = (buf, contentType = '') => {
    if (!buf || buf.length < 4) return 'unknown'
    const ct = String(contentType || '').toLowerCase()
    if (buf.slice(4, 8).toString('ascii') === 'ftyp') return 'video'
    if (buf[0] === 0xFF && buf[1] === 0xD8) return 'image'
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return 'image'
    if (buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') return 'image'
    if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) return 'audio'
    if (buf[0] === 0xFF && (buf[1] & 0xE0) === 0xE0) return 'audio'
    if (ct.startsWith('video/')) return 'video'
    if (ct.startsWith('image/')) return 'image'
    if (ct.startsWith('audio/')) return 'audio'
    return 'unknown'
}

const withTimeout = (promise, ms, label = 'op') => {
    let t
    const timeout = new Promise((_, rej) => {
        t = setTimeout(() => rej(new Error(`${label} timeout ${ms}ms`)), ms)
    })
    return Promise.race([promise, timeout]).finally(() => clearTimeout(t))
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchBuffer(url, maxBytes = MAX_FETCH) {
    if (!isValidUrl(url)) throw new Error('URL tidak valid')

    const strategies = [
        { label: 'default', headers: { 'User-Agent': UA, Accept: '*/*' } },
        { label: 'google-ref', headers: { 'User-Agent': UA, Accept: '*/*', Referer: 'https://www.google.com/' } }
    ]

    let lastErr
    for (const s of strategies) {
        try {
            const res = await withTimeout(
                axios.get(url, {
                    responseType: 'arraybuffer',
                    timeout: T_DL,
                    maxContentLength: maxBytes,
                    maxRedirects: 10,
                    headers: s.headers,
                    validateStatus: () => true
                }),
                T_DL + 5000,
                `dl-${s.label}`
            )

            const buf = Buffer.from(res.data || [])
            if (res.status >= 400) { lastErr = new Error(`HTTP ${res.status}`); continue }
            if (buf.length < 1024) { lastErr = new Error(`Buffer kecil (${buf.length}B)`); continue }
            if (isHtml(buf)) { lastErr = new Error('Response HTML'); continue }
            return { buffer: buf, contentType: res.headers['content-type'] || '' }
        } catch (e) {
            lastErr = new Error(`${s.label}: ${e.message}`)
        }
    }
    throw lastErr || new Error('Semua fetch gagal')
}

function buildCaption(result, idx, total, m) {
    const lines = ['🌐 *ALL IN ONE DOWNLOADER*', '']
    if (result.title) lines.push(`📌 *Judul:* ${String(result.title).slice(0, 200)}`)
    if (result.author) lines.push(`👤 *Author:* ${result.author}`)
    if (total > 1) lines.push(`📎 *${idx + 1}/${total}*`)
    lines.push(`⚙️ *Sumber:* ${result.platform || 'AIO'}`)
    lines.push(`✨ *Req:* ${m.pushName || 'User'}`)
    return lines.join('\n')
}

async function sendItem(denn, m, item, buffer, result, idx, total) {
    let kind = String(item.type || '').toLowerCase()
    if (!['video', 'image', 'audio'].includes(kind)) kind = 'unknown'
    if (kind === 'unknown') {
        const detected = detectKind(buffer, '')
        kind = ['video', 'image', 'audio'].includes(detected) ? detected : 'file'
    }

    const caption = buildCaption(result, idx, total, m)
    const quote = idx === 0 ? m : undefined

    if (kind === 'video') {
        if (buffer.length <= LIMIT_VIDEO) {
            try {
                await denn.sendMessage(m.chat, {
                    video: buffer, mimetype: 'video/mp4',
                    fileName: `aio_${Date.now()}_${idx}.mp4`, caption
                }, { quoted: quote })
                return true
            } catch (e) { log(`video[${idx}] err:`, e.message) }
        }
        if (buffer.length <= LIMIT_DOC) {
            try {
                await denn.sendMessage(m.chat, {
                    document: buffer, mimetype: 'video/mp4',
                    fileName: `aio_${Date.now()}_${idx}.mp4`, caption
                }, { quoted: quote })
                return true
            } catch (e) { log(`video-doc[${idx}] err:`, e.message) }
        }
        return false
    }

    if (kind === 'image') {
        if (buffer.length <= LIMIT_IMAGE) {
            try {
                await denn.sendMessage(m.chat, { image: buffer, caption }, { quoted: quote })
                return true
            } catch (e) { log(`image[${idx}] err:`, e.message) }
        }
        if (buffer.length <= LIMIT_DOC) {
            try {
                await denn.sendMessage(m.chat, {
                    document: buffer, mimetype: 'image/jpeg',
                    fileName: `aio_${Date.now()}_${idx}.jpg`, caption
                }, { quoted: quote })
                return true
            } catch (e) { log(`image-doc[${idx}] err:`, e.message) }
        }
        return false
    }

    if (kind === 'audio') {
        if (buffer.length <= LIMIT_AUDIO) {
            try {
                await denn.sendMessage(m.chat, {
                    audio: buffer, mimetype: 'audio/mpeg',
                    ptt: false, fileName: `aio_${Date.now()}_${idx}.mp3`
                }, { quoted: quote })
                return true
            } catch (e) { log(`audio[${idx}] err:`, e.message) }
        }
        if (buffer.length <= LIMIT_DOC) {
            try {
                await denn.sendMessage(m.chat, {
                    document: buffer, mimetype: 'audio/mpeg',
                    fileName: `aio_${Date.now()}_${idx}.mp3`, caption
                }, { quoted: quote })
                return true
            } catch (e) { log(`audio-doc[${idx}] err:`, e.message) }
        }
        return false
    }

    if (buffer.length <= LIMIT_DOC) {
        try {
            await denn.sendMessage(m.chat, {
                document: buffer, mimetype: 'application/octet-stream',
                fileName: `aio_${Date.now()}_${idx}.bin`, caption
            }, { quoted: quote })
            return true
        } catch (e) { log(`file[${idx}] err:`, e.message) }
    }

    return false
}

export default {
    command: ['aio', 'aiodl'],
    category: 'downloader',
    execute: async (denn, m, { prefix, text }) => {
        if (!text) return m.reply(
            `🌐 *ALL IN ONE DOWNLOADER*\n\n` +
            `📌 *Contoh:*\n\`${prefix}aio https://...\`\n\n` +
            `💡 *Support:* TikTok, Instagram, YouTube, Facebook, Twitter/X, Threads, Pinterest, Reddit, CapCut`
        )

        if (!isValidUrl(text)) return m.reply('❌ URL tidak valid. Harus dimulai dengan http/https!')

        let waitMsg
        try { waitMsg = await m.reply(global.msg.wait) } catch (_) {}

        const updateWait = async (t) => {
            if (!waitMsg?.key?.id) return
            try { await denn.sendMessage(m.chat, { text: t, edit: waitMsg.key }) } catch (_) {}
        }
        const deleteWait = async () => {
            if (!waitMsg?.key?.id) return
            try { await denn.sendMessage(m.chat, { delete: waitMsg.key }) } catch (_) {}
        }
        const finish = async (t) => {
            await deleteWait()
            try { await m.reply(t) } catch (_) {}
        }

        const task = (async () => {
            log('=== START ===', text.slice(0, 100))

            await updateWait('📡 Mengambil media...')

            let result
            try {
                result = await withTimeout(aiodl(text.trim()), 60000, 'aiodl')
            } catch (e) {
                log('aiodl err:', e.message)
                return finish(`❌ Gagal mengambil media.\n\n_${e.message}_\n\n_Pastikan link valid & platform didukung._`)
            }

            if (!result?.media?.length) {
                return finish(`❌ Tidak ada media ditemukan.\n\n_Platform: ${result?.platform || 'unknown'}_`)
            }

            const items = result.media.slice(0, MAX_ITEMS)
            log(`got ${items.length} item dari ${result.platform}`)

            let sent = 0
            for (let i = 0; i < items.length; i++) {
                const item = items[i]
                if (!isValidUrl(item.url)) {
                    log(`item ${i + 1} URL tidak valid, skip`)
                    continue
                }

                await updateWait(`⏬ Memproses ${i + 1}/${items.length}...`)

                let buffer
                try {
                    const max = item.type === 'video' ? LIMIT_VIDEO + 20 * 1024 * 1024
                        : item.type === 'audio' ? LIMIT_AUDIO + 20 * 1024 * 1024
                        : LIMIT_DOC
                    const r = await fetchBuffer(item.url, max)
                    buffer = r.buffer
                } catch (e) {
                    log(`item ${i + 1} fetch err:`, e.message)
                    continue
                }

                await updateWait(`📤 Mengirim ${i + 1}/${items.length}...`)

                try {
                    const ok = await sendItem(denn, m, item, buffer, result, i, items.length)
                    if (ok) sent++
                } catch (e) {
                    log(`item ${i + 1} send err:`, e.message)
                }

                if (i < items.length - 1) await sleep(800)
            }

            await deleteWait()

            if (sent === 0) {
                await m.reply('❌ Gagal mengirim media ke WhatsApp.')
            } else if (sent < items.length) {
                await m.reply(`⚠️ Hanya ${sent}/${items.length} media terkirim.`)
            }
        })()

        try {
            await withTimeout(task, T_GLOBAL, 'global')
        } catch (e) {
            log('GLOBAL TIMEOUT:', e.message)
            await finish(`⏱️ Timeout ${T_GLOBAL / 1000}s — server terlalu lambat. Coba lagi nanti.`)
        }
    }
}