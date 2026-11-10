import axios from 'axios'
import { fetchTermai } from '../../lib/helper.js'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const LIMIT_VIDEO = 60 * 1024 * 1024
const LIMIT_IMAGE = 10 * 1024 * 1024
const LIMIT_DOC = 100 * 1024 * 1024
const MAX_DOWNLOAD = LIMIT_DOC + 20 * 1024 * 1024

const T_API = 12000
const T_DL = 60000
const T_GLOBAL = 90000

const WEB_BASE = () => global.web || global.jereBaseUrl || 'https://api.jerexd.my.id'
const API_KEY = () => global.apikey?.jereapi || global.jereApiKey || ''

const log = (...a) => console.log('[IG]', ...a)

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
    if (ct.startsWith('video/')) return 'video'
    if (ct.startsWith('image/')) return 'image'
    return 'unknown'
}

const withTimeout = (promise, ms, label = 'op') => {
    let t
    const timeout = new Promise((_, rej) => {
        t = setTimeout(() => rej(new Error(`${label} timeout ${ms}ms`)), ms)
    })
    return Promise.race([promise, timeout]).finally(() => clearTimeout(t))
}

const isInstagram = (u) => /instagram\.com|instagr\.am/i.test(String(u || ''))

function pickAllUrls(obj) {
    if (!obj || typeof obj !== 'object') return []
    const out = new Set()
    function walk(o, d = 0) {
        if (d > 4 || !o || typeof o !== 'object') return
        if (Array.isArray(o)) { for (const v of o) walk(v, d + 1); return }
        for (const [k, v] of Object.entries(o)) {
            if (isValidUrl(v) && /(url|link|download|video|image|photo|media|src|hd|sd|mp4|jpg)/i.test(k)) out.add(v)
            else if (v && typeof v === 'object') walk(v, d + 1)
        }
    }
    walk(obj)
    return [...out]
}

const pickMeta = (data, raw) => {
    const d = data || {}, r = raw || {}
    return {
        author: d.author || d.username || d.user?.username || r.author || r.username || 'Instagram',
        caption: d.caption || d.title || d.desc || r.caption || r.title || ''
    }
}

async function fetchBuffer(url, { max = MAX_DOWNLOAD, min = 1024, referer = 'https://www.instagram.com/' } = {}) {
    if (!isValidUrl(url)) throw new Error('URL tidak valid')
    const strategies = [
        { label: 'ig-ref', headers: { 'User-Agent': UA, 'Referer': referer, 'Accept': '*/*' } },
        { label: 'no-ref', headers: { 'User-Agent': UA, 'Accept': '*/*' } }
    ]
    let lastErr
    for (const s of strategies) {
        try {
            const res = await withTimeout(axios.get(url, {
                responseType: 'arraybuffer',
                timeout: T_DL,
                maxContentLength: max,
                maxRedirects: 10,
                headers: s.headers,
                validateStatus: () => true
            }), T_DL + 5000, `dl-${s.label}`)

            const buf = Buffer.from(res.data || [])
            if (res.status >= 400) { lastErr = new Error(`HTTP ${res.status} (${s.label})`); continue }
            if (buf.length < min) { lastErr = new Error(`Buffer kecil (${buf.length}B, ${s.label})`); continue }
            if (isHtml(buf)) { lastErr = new Error(`HTML (${s.label})`); continue }
            return { buffer: buf, contentType: res.headers['content-type'] || '' }
        } catch (e) {
            lastErr = new Error(`${s.label}: ${e.message}`)
        }
    }
    throw lastErr || new Error('Semua fetch gagal')
}

async function extractTermai(url) {
    const data = await withTimeout(fetchTermai('/downloader/instagram', { url }), T_API + 5000, 'termai-ig')
    if (!data) return null
    const urls = pickAllUrls(data)
    if (!urls.length) return null
    log('termai ✓', urls.length, 'url')
    return { urls, meta: pickMeta(data, data), source: 'Termai' }
}

async function extractJere(url) {
    const key = API_KEY()
    if (!key) return null
    try {
        let data = null
        try {
            const res = await withTimeout(axios.post(`${WEB_BASE()}/api/downloader/instagram`, {
                apikey: key, url
            }, {
                timeout: T_API,
                headers: { 'User-Agent': UA, 'Content-Type': 'application/json' },
                validateStatus: () => true
            }), T_API + 2000, 'jere-ig-post')
            if (res.status < 400 && res.data?.status) data = res.data
        } catch (_) {}

        if (!data) {
            const res = await withTimeout(axios.get(`${WEB_BASE()}/api/downloader/instagram`, {
                params: { apikey: key, url },
                timeout: T_API,
                headers: { 'User-Agent': UA },
                validateStatus: () => true
            }), T_API + 2000, 'jere-ig-get')
            if (res.status >= 400 || !res.data?.status) return null
            data = res.data
        }

        const result = data.result || data.data || data
        const urls = pickAllUrls(result)
        if (!urls.length) return null
        log('jere ✓', urls.length, 'url')
        return { urls, meta: pickMeta(result, data), source: 'Jere' }
    } catch (e) {
        log('jere err:', e.message)
        return null
    }
}

async function extractBtch(url) {
    const base = global.baseBtch || 'https://btch-downloader-api-green.vercel.app'
    try {
        const res = await withTimeout(axios.get(`${base}/api/download/ig`, {
            params: { url },
            timeout: T_API,
            headers: { 'User-Agent': UA },
            validateStatus: () => true
        }), T_API + 2000, 'btch-ig')

        if (res.status >= 400 || !res.data) return null
        const urls = pickAllUrls(res.data)
        if (!urls.length) return null
        log('btch ✓', urls.length, 'url')
        return { urls, meta: pickMeta(res.data, res.data), source: 'BTCH' }
    } catch (e) {
        log('btch err:', e.message)
        return null
    }
}

const extractors = [extractTermai, extractJere, extractBtch]

async function resolveMedia(url) {
    const errors = []

    for (const fn of extractors) {
        let data
        try {
            data = await fn(url)
        } catch (e) {
            errors.push(`${fn.name}: ${e.message}`)
            continue
        }
        if (!data || !data.urls.length) continue

        const mediaItems = []
        for (const u of data.urls) {
            try {
                const { buffer, contentType } = await fetchBuffer(u)
                const kind = detectKind(buffer, contentType)
                if (kind === 'video' || kind === 'image') {
                    mediaItems.push({ buffer, kind, source: data.source })
                }
            } catch (e) {
                log(`dl fail: ${e.message}`)
            }
        }

        if (mediaItems.length) {
            return { items: mediaItems, meta: data.meta, source: data.source }
        }
        errors.push(`${fn.name}: semua URL gagal diunduh`)
    }

    throw new Error(errors[0] || 'Semua sumber gagal')
}

async function sendOne(denn, m, item, meta, idx, total) {
    const caption = `📸 *INSTAGRAM DOWNLOADER*\n\n` +
        `👤 *Author:* ${meta.author}\n` +
        (meta.caption ? `📝 *Caption:* ${meta.caption.slice(0, 200)}\n` : '') +
        (total > 1 ? `📎 *${idx + 1}/${total}*\n` : '') +
        `⚙️ *Sumber:* ${item.source}\n` +
        `✨ *Req:* ${m.pushName || 'User'}`

    if (item.kind === 'video') {
        if (item.buffer.length <= LIMIT_VIDEO) {
            try {
                await denn.sendMessage(m.chat, {
                    video: item.buffer,
                    mimetype: 'video/mp4',
                    fileName: `instagram_${Date.now()}_${idx}.mp4`,
                    caption
                }, { quoted: idx === 0 ? m : undefined })
                return true
            } catch (e) { log(`send video[${idx}] err:`, e.message) }
        }
        if (item.buffer.length <= LIMIT_DOC) {
            try {
                await denn.sendMessage(m.chat, {
                    document: item.buffer,
                    mimetype: 'video/mp4',
                    fileName: `instagram_${Date.now()}_${idx}.mp4`,
                    caption
                }, { quoted: idx === 0 ? m : undefined })
                return true
            } catch (e) { log(`send video doc[${idx}] err:`, e.message) }
        }
        return false
    }

    if (item.kind === 'image') {
        if (item.buffer.length <= LIMIT_IMAGE) {
            try {
                await denn.sendMessage(m.chat, {
                    image: item.buffer,
                    caption
                }, { quoted: idx === 0 ? m : undefined })
                return true
            } catch (e) { log(`send image[${idx}] err:`, e.message) }
        }
        if (item.buffer.length <= LIMIT_DOC) {
            try {
                await denn.sendMessage(m.chat, {
                    document: item.buffer,
                    mimetype: 'image/jpeg',
                    fileName: `instagram_${Date.now()}_${idx}.jpg`,
                    caption
                }, { quoted: idx === 0 ? m : undefined })
                return true
            } catch (e) { log(`send image doc[${idx}] err:`, e.message) }
        }
    }

    return false
}

export default {
    command: ['instagram', 'ig', 'igdl', 'igvideo', 'igphoto', 'igreels'],
    category: 'downloader',
    execute: async (denn, m, { prefix, text }) => {
        if (!text) return m.reply(
            `📸 *INSTAGRAM DOWNLOADER*\n\n` +
            `📌 *Contoh:*\n\`${prefix}instagram https://www.instagram.com/reel/xxxx\`\n` +
            `\`${prefix}ig https://www.instagram.com/p/xxxx\``
        )

        if (!isInstagram(text)) return m.reply('❌ URL tidak valid. Pastikan menggunakan link Instagram!')

        let waitMsg
        try {
            waitMsg = await m.reply(global.msg.wait)
        } catch (_) {}

        const updateWait = async (newText) => {
            if (!waitMsg?.key?.id) return
            try { await denn.sendMessage(m.chat, { text: newText, edit: waitMsg.key }) } catch (_) {}
        }

        const deleteWait = async () => {
            if (!waitMsg?.key?.id) return
            try { await denn.sendMessage(m.chat, { delete: waitMsg.key }) } catch (_) {}
        }

        const finish = async (msgText) => {
            await deleteWait()
            try { await m.reply(msgText) } catch (_) {}
        }

        const task = (async () => {
            log('=== START ===')

            await updateWait('📡 Mengambil media Instagram...')

            let resolved
            try {
                resolved = await resolveMedia(text.trim())
            } catch (e) {
                log('resolve error:', e.message)
                await finish(`❌ Gagal mengunduh Instagram.\n\n_${e.message}_`)
                return
            }

            const { items, meta, source } = resolved
            log(`Total ${items.length} media dari ${source}`)

            if (!items.length) {
                await finish('❌ Tidak ada media yang berhasil diunduh.')
                return
            }

            let sentCount = 0
            for (let i = 0; i < items.length; i++) {
                await updateWait(`📤 Mengirim ${i + 1}/${items.length}...`)
                const ok = await sendOne(denn, m, items[i], meta, i, items.length)
                if (ok) sentCount++
            }

            await deleteWait()

            if (sentCount === 0) {
                await m.reply('❌ Gagal mengirim media ke WhatsApp.')
            } else if (sentCount < items.length) {
                await m.reply(`⚠️ Hanya ${sentCount}/${items.length} media terkirim. Sisanya gagal.`)
            }
        })()

        try {
            await withTimeout(task, T_GLOBAL, 'global')
        } catch (e) {
            log('GLOBAL TIMEOUT:', e.message)
            await finish(`⏱️ *Timeout ${T_GLOBAL / 1000}s* — server terlalu lambat. Coba lagi.`)
        }
    }
}