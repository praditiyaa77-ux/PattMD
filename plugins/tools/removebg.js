import FormData from 'form-data'
import axios from 'axios'
import { getBuffer } from '../../lib/helper.js'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const MAX_INPUT = 15 * 1024 * 1024
const MAX_OUTPUT = 20 * 1024 * 1024
const T_API = 60000
const T_DL = 30000

const WEB_BASE = () => global.web || global.jereBaseUrl || 'https://api.jerexd.my.id'
const API_KEY = () => global.apikey?.jereapi || global.jereApiKey || ''

const log = (...a) => console.log('[RemoveBG]', ...a)

const isHtml = (buf) => {
    if (!buf || buf.length < 16) return true
    const head = buf.slice(0, 512).toString('utf8').toLowerCase()
    return head.includes('<!doctype') || head.includes('<html') || head.includes('<body')
}

// Validasi magic bytes gambar (termasuk GIF & WEBP)
const isImageBuf = (buf) => {
    if (!buf || buf.length < 100) return false
    if (buf[0] === 0xFF && buf[1] === 0xD8) return true // JPG
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return true // PNG
    if (buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') return true // WEBP
    if (buf.slice(0, 3).toString('ascii') === 'GIF') return true // GIF
    return false
}

const withTimeout = (promise, ms, label = 'op') => {
    let t
    const timeout = new Promise((_, rej) => {
        t = setTimeout(() => rej(new Error(`${label} timeout ${ms}ms`)), ms)
    })
    return Promise.race([promise, timeout]).finally(() => clearTimeout(t))
}

async function callRemoveBgApi(buffer, mime) {
    const key = API_KEY()
    if (!key) throw new Error('API key kosong. Set jereApiKey di settings.js')

    const form = new FormData()
    form.append('file', buffer, { filename: 'image.png', contentType: mime || 'image/jpeg' })

    const url = `${WEB_BASE()}/api/tools/removebg?apikey=${encodeURIComponent(key)}`
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
        validateStatus: () => true,
        responseType: 'arraybuffer' // <-- PENTING: Mencegah Axios memparsing JSON error menjadi objek
    }), T_API + 8000, 'removebg-api')

    const outBuf = Buffer.from(res.data || [])
    const contentType = String(res.headers['content-type'] || '').toLowerCase()

    // 1. Cek apakah API membalas JSON (error) meskipun statusnya 200 OK
    if (contentType.includes('application/json')) {
        try {
            const json = JSON.parse(outBuf.toString('utf8'))
            throw new Error(json.error || json.message || 'API mengembalikan pesan error JSON')
        } catch (e) {
            if (e.message.includes('JSON error') || e.message.includes('pesan error')) throw e
            throw new Error('Gagal mem-parsing respons JSON dari server')
        }
    }

    // 2. Cek HTTP Status Error
    if (res.status >= 400) {
        throw new Error(`HTTP Error ${res.status}`)
    }

    // 3. Cek validasi buffer
    if (outBuf.length < 100) {
        throw new Error('Hasil gambar transparan kosong / terlalu kecil')
    }
    if (isHtml(outBuf)) {
        throw new Error('Server mengembalikan halaman HTML, bukan gambar')
    }
    if (!isImageBuf(outBuf)) {
        throw new Error(`Format gambar tidak dikenali (Magic Bytes: ${outBuf.slice(0, 4).toString('hex')})`)
    }

    return outBuf
}

export default {
    command: ['removebg', 'nobg', 'hapusbg', 'transparan'],
    category: 'tools',
    execute: async (denn, m, { prefix, command }) => {
        let imgMsg = null
        let imgMime = ''

        // Cek reply gambar atau gambar langsung dengan caption
        if (m.quoted?.msg && typeof m.quoted.msg.mimetype === 'string' && m.quoted.msg.mimetype.startsWith('image/')) {
            imgMsg = m.quoted.msg
            imgMime = m.quoted.msg.mimetype
        } else if (m.mtype === 'imageMessage' && typeof m.msg?.mimetype === 'string' && m.msg.mimetype.startsWith('image/')) {
            imgMsg = m.msg
            imgMime = m.msg.mimetype
        }

        if (!imgMsg) {
            return m.reply(
                `✂️ *REMOVE BACKGROUND*\n\n` +
                `📌 *Cara pakai:*\n` +
                `• Kirim gambar dengan caption \`${prefix}${command}\`\n` +
                `• Atau reply gambar dengan \`${prefix}${command}\`\n\n` +
                `💡 Support: JPG, PNG, WEBP\n` +
                `📦 Maks input: 15 MB`
            )
        }

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

        log(`input ${(inputBuffer.length / 1024 / 1024).toFixed(2)}MB | mime=${imgMime}`)

        await m.reply('⏳ Menghapus background... Mohon tunggu.')

        let outBuffer
        try {
            outBuffer = await callRemoveBgApi(inputBuffer, imgMime)
        } catch (e) {
            log('api err:', e.message)
            return m.reply(`❌ Gagal memproses RemoveBG.\n\n_${e.message}_`)
        }

        const beforeKB = (inputBuffer.length / 1024).toFixed(0)
        const afterKB = (outBuffer.length / 1024).toFixed(0)
        
        const caption =
            `✂️ *BACKGROUND BERHASIL DIHAPUS*\n\n` +
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
                mimetype: 'image/png',
                fileName: `removebg_${Date.now()}.png`,
                caption
            }, { quoted: m })
            return
        } catch (e) {
            log('send doc err:', e.message)
        }

        return m.reply('❌ Gagal mengirim gambar hasil ke WhatsApp.')
    }
}