import FormData from 'form-data'
import axios from 'axios'
import { getBuffer } from '../../lib/helper.js'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const MAX_INPUT = 15 * 1024 * 1024
const MAX_OUTPUT = 25 * 1024 * 1024
const T_API = 60000
const T_DL = 30000

const WEB_BASE = () => global.web || global.jereBaseUrl || 'https://api.jerexd.my.id'
const API_KEY = () => global.apikey?.jereapi || global.jereApiKey || ''

const log = (...a) => console.log('[HD]', ...a)

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

async function callHdApi(buffer, mime, scale) {
    const key = API_KEY()
    if (!key) throw new Error('API key kosong. Set jereApiKey di settings.js')

    const form = new FormData()
    form.append('file', buffer, { filename: 'image.jpg', contentType: mime || 'image/jpeg' })
    form.append('scale', String(scale))

    const url = `${WEB_BASE()}/api/tools/hd?apikey=${encodeURIComponent(key)}`
    const headers = {
        ...form.getHeaders(),
        'Content-Length': form.getLengthSync(),
        'User-Agent': UA
    }

    const res = await withTimeout(axios.post(url, form, {
        headers,
        timeout: T_API,
        maxContentLength: MAX_OUTPUT,
        maxBodyLength: MAX_INPUT,
        validateStatus: () => true
    }), T_API + 8000, 'hd-api')

    if (res.status >= 400) throw new Error(`HTTP ${res.status}`)
    const json = res.data
    if (!json?.status) throw new Error(json?.error || json?.message || 'Gagal proses HD')
    return json.result || {}
}

async function fetchImage(url) {
    if (!/^https?:\/\//i.test(url)) throw new Error('URL output tidak valid')
    const res = await withTimeout(axios.get(url, {
        responseType: 'arraybuffer',
        timeout: T_DL,
        maxContentLength: MAX_OUTPUT,
        maxRedirects: 5,
        headers: { 'User-Agent': UA },
        validateStatus: () => true
    }), T_DL + 5000, 'dl-output')

    const buf = Buffer.from(res.data || [])
    if (res.status >= 400) throw new Error(`HTTP ${res.status}`)
    if (buf.length < 1024) throw new Error('Buffer output kecil')
    if (isHtml(buf)) throw new Error('Response HTML')
    if (!isImageBuf(buf)) throw new Error('Bukan gambar')
    return buf
}

export default {
    command: ['hd', 'remini', 'hdr', 'upscale', 'jernih'],
    category: 'tools',
    execute: async (denn, m, { prefix, command, text }) => {
        let imgMsg = null
        let imgMime = ''

        if (m.quoted?.msg && typeof m.quoted.msg.mimetype === 'string' && m.quoted.msg.mimetype.startsWith('image/')) {
            imgMsg = m.quoted.msg
            imgMime = m.quoted.msg.mimetype
        } else if (m.mtype === 'imageMessage' && typeof m.msg?.mimetype === 'string' && m.msg.mimetype.startsWith('image/')) {
            imgMsg = m.msg
            imgMime = m.msg.mimetype
        }

        if (!imgMsg) {
            return m.reply(
                `✨ *HD ENHANCER / REMINI*\n\n` +
                `📌 *Cara pakai:*\n` +
                `• Kirim gambar dengan caption \`${prefix}${command}\`\n` +
                `• Atau reply gambar dengan \`${prefix}${command}\`\n` +
                `• Skala 4x: \`${prefix}${command} 4\`\n\n` +
                `💡 Support: JPG, PNG, WEBP, GIF\n` +
                `📦 Maks input: 15 MB`
            )
        }

        const scale = String(text || '').trim().startsWith('4') ? '4' : '2'

        await m.reply(global.msg.wait)

        let inputBuffer
        try {
            inputBuffer = await withTimeout(getBuffer(imgMsg, 'image'), T_DL, 'dl-input')
        } catch (e) {
            log('download input err:', e.message)
            return m.reply(`❌ Gagal unduh gambar sumber.\n\n_${e.message}_`)
        }

        if (!inputBuffer || inputBuffer.length < 1024) {
            return m.reply('❌ Buffer gambar kosong atau rusak.')
        }
        if (!isImageBuf(inputBuffer)) {
            return m.reply('❌ File bukan gambar valid.')
        }
        if (inputBuffer.length > MAX_INPUT) {
            return m.reply(`❌ Gambar terlalu besar (${(inputBuffer.length / 1024 / 1024).toFixed(2)} MB). Maks 15 MB.`)
        }

        log(`input ${(inputBuffer.length / 1024 / 1024).toFixed(2)}MB | mime=${imgMime} | scale=${scale}`)

        await m.reply(`⏳ Meningkatkan resolusi (${scale}x)... Mohon tunggu.`)

        let result
        try {
            result = await callHdApi(inputBuffer, imgMime, scale)
        } catch (e) {
            log('api err:', e.message)
            return m.reply(`❌ Gagal proses HD.\n\n_${e.message}_`)
        }

        const outUrl = result.upscaled_url || result.url || result.output
        if (!outUrl) return m.reply('❌ API tidak mengembalikan URL hasil.')

        let outBuffer
        try {
            outBuffer = await fetchImage(outUrl)
        } catch (e) {
            log('fetch output err:', e.message)
            return m.reply(`⚠️ Berhasil diproses tapi gagal diunduh.\n\n_${e.message}_\n\n📥 Link: ${outUrl}`)
        }

        const appliedScale = result.scale_applied || `${scale}x`
        const beforeKB = (inputBuffer.length / 1024).toFixed(0)
        const afterKB = (outBuffer.length / 1024).toFixed(0)
        const caption =
            `✨ *HD ENHANCER*\n\n` +
            `📸 *Skala:* ${appliedScale}\n` +
            `📦 *Ukuran:* ${beforeKB} KB → ${afterKB} KB\n` +
            `✨ *Request:* ${m.pushName || 'User'}`

        try {
            await denn.sendMessage(m.chat, { image: outBuffer, caption }, { quoted: m })
            return
        } catch (e) {
            log('send image err:', e.message)
        }

        try {
            await denn.sendMessage(m.chat, {
                document: outBuffer,
                mimetype: 'image/jpeg',
                fileName: `hd_${Date.now()}.jpg`,
                caption
            }, { quoted: m })
            return
        } catch (e) {
            log('send doc err:', e.message)
        }

        return m.reply(`❌ Gagal kirim gambar hasil.\n\n📥 Link: ${outUrl}`)
    }
}