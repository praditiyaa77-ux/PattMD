import axios from 'axios'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const LIMIT_DOC = 100 * 1024 * 1024
const MAX_DOWNLOAD = LIMIT_DOC + 20 * 1024 * 1024

const T_API = 15000
const T_DL = 120000
const T_GLOBAL = 180000

const WEB_BASE = () => global.web || global.jereBaseUrl || 'https://api.jerexd.my.id'
const API_KEY = () => global.apikey?.jereapi || global.jereApiKey || ''

const log = (...a) => console.log('[MF]', ...a)

const isValidUrl = (u) => typeof u === 'string' && /^https?:\/\//i.test(u)

const isHtml = (buf) => {
    if (!buf || buf.length < 16) return true
    const head = buf.slice(0, 512).toString('utf8').toLowerCase()
    return head.includes('<!doctype') || head.includes('<html') || head.includes('<body')
}

const isMediafire = (u) => /mediafire\.com|mfdl\.com/i.test(String(u || ''))

const withTimeout = (promise, ms, label = 'op') => {
    let t
    const timeout = new Promise((_, rej) => {
        t = setTimeout(() => rej(new Error(`${label} timeout ${ms}ms`)), ms)
    })
    return Promise.race([promise, timeout]).finally(() => clearTimeout(t))
}

function pickDownloadUrl(obj) {
    if (!obj || typeof obj !== 'object') return null

    const direct = [
        obj.download, obj.download_url, obj.downloadUrl,
        obj.url, obj.link,
        obj.result?.download_url, obj.result?.downloadUrl, obj.result?.download,
        obj.result?.url, obj.result?.link,
        obj.data?.download, obj.data?.url, obj.data?.link
    ].find(isValidUrl)

    return direct || null
}

function pickMeta(obj) {
    if (!obj || typeof obj !== 'object') return {}
    const r = obj.result || obj.data || obj
    const filename = r.filename || r.name || r.file_name || 'mediafire_file'
    const filesize = r.filesize || r.size || r.file_size || '-'
    const ext = r.ext || r.extension || (filename.includes('.') ? filename.split('.').pop() : 'bin')
    return { filename, filesize, ext }
}

async function fetchInfoJere(url) {
    const key = API_KEY()
    if (!key) return null
    try {
        const res = await withTimeout(axios.get(`${WEB_BASE()}/api/downloader/mediafire`, {
            params: { apikey: key, url },
            timeout: T_API,
            headers: { 'User-Agent': UA },
            validateStatus: () => true
        }), T_API + 3000, 'jere-mf')

        if (res.status >= 400) { log('jere HTTP', res.status); return null }
        if (!res.data?.status) { log('jere status=false'); return null }

        const dl = pickDownloadUrl(res.data)
        if (!dl) { log('jere no url'); return null }

        const meta = pickMeta(res.data)
        log('jere ✓', meta.filename)
        return { downloadUrl: dl, meta, source: 'Jere' }
    } catch (e) {
        log('jere err:', e.message)
        return null
    }
}

async function fetchInfoBtch(url) {
    const base = global.baseBtch || 'https://btch-downloader-api-green.vercel.app'
    const key = global.btchApiKey || ''
    try {
        const res = await withTimeout(axios.get(`${base}/api/downloader/mediafire`, {
            params: { url, apikey: key },
            timeout: T_API,
            headers: { 'User-Agent': UA },
            validateStatus: () => true
        }), T_API + 3000, 'btch-mf')

        if (res.status >= 400) return null
        const dl = pickDownloadUrl(res.data)
        if (!dl) return null
        const meta = pickMeta(res.data)
        log('btch ✓', meta.filename)
        return { downloadUrl: dl, meta, source: 'BTCH' }
    } catch (e) {
        log('btch err:', e.message)
        return null
    }
}

async function fetchInfoLegacy(url) {
    try {
        const res = await withTimeout(axios.get('https://btch-downloader-api-green.vercel.app/api/mediafire', {
            params: { url },
            timeout: T_API,
            headers: { 'User-Agent': UA },
            validateStatus: () => true
        }), T_API + 3000, 'legacy-mf')

        if (res.status >= 400) return null
        const dl = pickDownloadUrl(res.data)
        if (!dl) return null
        const meta = pickMeta(res.data)
        log('legacy ✓', meta.filename)
        return { downloadUrl: dl, meta, source: 'Legacy' }
    } catch (e) {
        log('legacy err:', e.message)
        return null
    }
}

const extractors = [fetchInfoJere, fetchInfoBtch, fetchInfoLegacy]

async function resolveInfo(url) {
    const errors = []
    for (const fn of extractors) {
        try {
            const r = await fn(url)
            if (r && r.downloadUrl) return r
        } catch (e) {
            errors.push(`${fn.name}: ${e.message}`)
        }
    }
    throw new Error(errors[0] || 'Semua sumber gagal')
}

async function downloadBuffer(url) {
    if (!isValidUrl(url)) throw new Error('URL tidak valid')

    const strategies = [
        { label: 'mf-ref', headers: { 'User-Agent': UA, 'Referer': 'https://www.mediafire.com/', 'Accept': '*/*' } },
        { label: 'no-ref', headers: { 'User-Agent': UA, 'Accept': '*/*' } }
    ]

    let lastErr
    for (const s of strategies) {
        try {
            const res = await withTimeout(axios.get(url, {
                responseType: 'arraybuffer',
                timeout: T_DL,
                maxContentLength: MAX_DOWNLOAD,
                maxRedirects: 10,
                headers: s.headers,
                validateStatus: () => true
            }), T_DL + 5000, `dl-${s.label}`)

            const buf = Buffer.from(res.data || [])
            if (res.status >= 400) { lastErr = new Error(`HTTP ${res.status} (${s.label})`); continue }
            if (buf.length < 1024) { lastErr = new Error(`Buffer kecil (${buf.length}B)`); continue }
            if (isHtml(buf)) { lastErr = new Error(`HTML response (${s.label})`); continue }
            log(`dl ✓ ${(buf.length / 1024 / 1024).toFixed(2)}MB via ${s.label}`)
            return buf
        } catch (e) {
            lastErr = new Error(`${s.label}: ${e.message}`)
        }
    }
    throw lastErr || new Error('Semua fetch gagal')
}

async function sendDocument(denn, m, buffer, filename, mimetype, caption) {
    try {
        await denn.sendMessage(m.chat, {
            document: buffer,
            mimetype,
            fileName: filename,
            caption
        }, { quoted: m })
        return true
    } catch (e) {
        log('send doc err:', e.message)
        return false
    }
}

const guessMimetype = (ext) => {
    const e = String(ext || '').toLowerCase()
    const map = {
        mp4: 'video/mp4',
        mkv: 'video/x-matroska',
        avi: 'video/x-msvideo',
        mp3: 'audio/mpeg',
        m4a: 'audio/mp4',
        wav: 'audio/wav',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        pdf: 'application/pdf',
        zip: 'application/zip',
        rar: 'application/vnd.rar',
        '7z': 'application/x-7z-compressed',
        apk: 'application/vnd.android.package-archive',
        txt: 'text/plain',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
    return map[e] || 'application/octet-stream'
}

export default {
    command: ['mediafire', 'mfdl'],
    category: 'downloader',
    execute: async (denn, m, { prefix, text }) => {
        if (!text) return m.reply(
            `📁 *MEDIAFIRE DOWNLOADER*\n\n` +
            `📌 *Contoh:*\n\`${prefix}mediafire https://www.mediafire.com/file/xxxx\``
        )

        if (!isMediafire(text)) return m.reply('❌ URL tidak valid. Pastikan menggunakan link MediaFire!')

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

            await updateWait('📡 Mengambil info MediaFire...')

            let info
            try {
                info = await resolveInfo(text.trim())
            } catch (e) {
                log('resolve error:', e.message)
                await finish(`❌ Gagal ambil info MediaFire.\n\n_${e.message}_`)
                return
            }

            const { downloadUrl, meta, source } = info
            log('Download URL:', downloadUrl.slice(0, 80), '| Source:', source)

            await updateWait('⏬ Mengunduh file...')

            let buffer
            try {
                buffer = await downloadBuffer(downloadUrl)
            } catch (e) {
                log('download error:', e.message)
                await finish(
                    `❌ Gagal mengunduh file.\n\n_${e.message}_\n\n` +
                    `📥 Link manual:\n${downloadUrl}`
                )
                return
            }

            const sizeMB = (buffer.length / 1024 / 1024).toFixed(2)
            const mimetype = guessMimetype(meta.ext)

            const caption =
                `📁 *MEDIAFIRE DOWNLOADER*\n\n` +
                `📄 *Nama:* ${meta.filename}\n` +
                `📏 *Ukuran:* ${sizeMB} MB\n` +
                `🏷️ *Tipe:* ${String(meta.ext).toUpperCase()}\n` +
                `⚙️ *Sumber:* ${source}\n` +
                `✨ *Request:* ${m.pushName || 'User'}`

            await updateWait('📤 Mengirim file...')

            const sent = await sendDocument(denn, m, buffer, meta.filename, mimetype, caption)

            await deleteWait()

            if (!sent) {
                if (buffer.length > LIMIT_DOC) {
                    await m.reply(
                        `${caption}\n\n⚠️ *Ukuran ${sizeMB} MB melebihi batas WhatsApp (100MB).*\n\n` +
                        `📥 *Link download:*\n${downloadUrl}`
                    )
                } else {
                    await m.reply(
                        `❌ Gagal mengirim file ke WhatsApp.\n\n` +
                        `📥 *Link manual:*\n${downloadUrl}`
                    )
                }
            }
        })()

        try {
            await withTimeout(task, T_GLOBAL, 'global')
        } catch (e) {
            log('GLOBAL TIMEOUT:', e.message)
            await finish(`⏱️ *Timeout ${T_GLOBAL / 1000}s* — file terlalu besar atau server lambat. Coba lagi.`)
        }
    }
}