import axios from 'axios'
import FormData from 'form-data'
import { getBuffer } from '../../lib/helper.js'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const T_API = 45000
const T_UPLOAD = 20000
const T_GLOBAL = 60000
const DEFAULT_AVATAR = 'https://i.ibb.co/3sXKqK5/avatar.png'

const WEB_BASE = () => global.web || global.jereBaseUrl || 'https://api.jerexd.my.id'
const API_KEY = () => global.apikey?.jereapi || global.jereApiKey || ''

const log = (...a) => console.log('[IGProfile]', ...a)

const isHtml = (buf) => {
    if (!buf || buf.length < 16) return true
    const head = buf.slice(0, 512).toString('utf8').toLowerCase()
    return head.includes('<!doctype') || head.includes('<html') || head.includes('<body')
}

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

// Upload ke Catbox.moe
async function uploadImage(buffer, filename = 'image.jpg') {
    const form = new FormData()
    form.append('reqtype', 'fileupload')
    form.append('fileToUpload', buffer, { filename })

    const res = await withTimeout(axios.post('https://catbox.moe/user/api.php', form, {
        headers: { ...form.getHeaders(), 'User-Agent': UA },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: T_UPLOAD,
        validateStatus: () => true
    }), T_UPLOAD + 5000, 'upload')

    const url = typeof res.data === 'string' ? res.data.trim() : ''
    if (!url || !/^https?:\/\//i.test(url)) throw new Error('Upload ke Catbox gagal')
    return url
}

export default {
    command: ['igprofile', 'fakeig'],
    category: 'maker',
    execute: async (denn, m, { prefix, command, text }) => {
        const key = API_KEY()
        if (!key) return m.reply('❌ API key kosong. Set `jereApiKey` di settings.js')

        const input = m.quoted && m.quoted.text && !text ? m.quoted.text : text

        if (!input || !input.includes('|')) {
            return m.reply(
                `📸 *FAKE IG PROFILE*\n\n` +
                `📌 *Format:*\n` +
                `\`${prefix}${command} <username>|<bio>|<postingan>|<pengikut>|<mengikuti>\`\n\n` +
                `📌 *Contoh:*\n` +
                `\`${prefix}${command} lumnztyz6x|I am programmer|12|100M|2\`\n\n` +
                `_(Bisa reply gambar untuk custom PP atau otomatis menggunakan foto profil WhatsApp)_`
            )
        }

        const parts = input.split('|')
        if (parts.length < 5) {
            return m.reply("⚠️ Format salah! Pastikan semua diisi dipisah dengan tanda |")
        }

        const [username, bio, postingan, pengikut, mengikuti] = parts.map(p => p.trim())

        let imgMsg = null
        if (m.quoted?.msg && typeof m.quoted.msg.mimetype === 'string' && m.quoted.msg.mimetype.startsWith('image/')) {
            imgMsg = m.quoted.msg
        } else if (m.mtype === 'imageMessage' && typeof m.msg?.mimetype === 'string' && m.msg.mimetype.startsWith('image/')) {
            imgMsg = m.msg
        }

        const who = m.mentionedJid?.[0] || m.quoted?.sender || (m.key.fromMe ? denn.user?.id : m.sender)

        await m.reply(global.msg.wait)

        const task = (async () => {
            let imageBuffer = null

            // 1. Ambil gambar dari reply/kirim
            if (imgMsg) {
                try {
                    imageBuffer = await withTimeout(getBuffer(imgMsg, 'image'), 30000, 'dl-img')
                } catch (e) {
                    log('getBuffer err:', e.message)
                }
            }

            // 2. Jika tidak ada gambar, ambil PP target
            if (!imageBuffer || imageBuffer.length < 1024) {
                try {
                    const ppUrl = await denn.profilePictureUrl(who, 'image')
                    if (ppUrl) {
                        const res = await withTimeout(axios.get(ppUrl, {
                            responseType: 'arraybuffer', timeout: 15000, maxContentLength: 5 * 1024 * 1024, headers: { 'User-Agent': UA }
                        }), 18000, 'dl-pp')
                        imageBuffer = Buffer.from(res.data || [])
                    }
                } catch (e) {
                    log('fetch PP gagal:', e.message)
                }
            }

            // 3. Upload ke Catbox
            let ppUrl = ''
            if (imageBuffer && imageBuffer.length > 1024 && isImageBuf(imageBuffer)) {
                await m.reply('📤 Upload foto profil...')
                try {
                    ppUrl = await uploadImage(imageBuffer, `igpp_${Date.now()}.jpg`)
                } catch (e) {
                    log('upload gagal:', e.message)
                }
            }

            // Fallback default avatar jika gagal
            if (!ppUrl) ppUrl = DEFAULT_AVATAR

            // 4. Panggil API
            await m.reply('🎨 Membuat Fake IG Profile...')

            let res
            try {
                res = await withTimeout(axios.get(`${WEB_BASE()}/api/maker/fakeigprofile`, {
                    params: {
                        apikey: key,
                        pp: ppUrl,
                        username: username,
                        bio: bio,
                        postingan: postingan,
                        pengikut: pengikut,
                        mengikuti: mengikuti
                    },
                    responseType: 'arraybuffer',
                    timeout: T_API,
                    maxContentLength: 20 * 1024 * 1024,
                    headers: { 'User-Agent': UA },
                    validateStatus: () => true
                }), T_API + 5000, 'ig-api')
            } catch (e) {
                log('api fetch err:', e.message)
                return m.reply(`❌ Gagal menghubungi server.\n\n_${e.message}_`)
            }

            // 5. Handle Error & Validasi
            const outBuf = Buffer.from(res.data || [])
            const ct = String(res.headers['content-type'] || '').toLowerCase()

            if (ct.includes('application/json')) {
                let json = null;
                try {
                    json = JSON.parse(outBuf.toString('utf8'));
                } catch (_) {
                    return m.reply('❌ Respons API tidak valid (JSON rusak)');
                }
                return m.reply(`❌ API Error: ${json.error || json.message || json.msg || 'Gagal memproses gambar'}`);
            }

            if (res.status >= 400) {
                return m.reply(`❌ Server Error (HTTP ${res.status})`)
            }

            if (outBuf.length < 1024 || isHtml(outBuf) || !isImageBuf(outBuf)) {
                return m.reply('❌ Hasil bukan gambar valid.')
            }

            // 6. Kirim Hasil
            const caption = `✅ *FAKE IG PROFILE BERHASIL*\n\n👤 *Username:* ${username}\n✨ *Request by:* ${m.pushName || 'User'}`

            try {
                await denn.sendMessage(m.chat, { image: outBuf, caption }, { quoted: m })
            } catch (e) {
                log('send image err:', e.message)
                await denn.sendMessage(m.chat, {
                    document: outBuf,
                    mimetype: 'image/png',
                    fileName: `igprofile_${Date.now()}.png`,
                    caption
                }, { quoted: m })
            }
        })()

        try {
            await withTimeout(task, T_GLOBAL, 'global')
        } catch (e) {
            log('global timeout:', e.message)
            return m.reply(`⏱️ Proses terlalu lama (> ${T_GLOBAL / 1000}s). Coba lagi.`)
        }
    }
}