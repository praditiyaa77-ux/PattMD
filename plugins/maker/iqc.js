import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { getBuffer } from '../../lib/helper.js'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const T_API = 45000 // Timeout API diperpanjang karena IQC kadang butuh waktu
const T_UPLOAD = 20000
const T_GLOBAL = 60000
const DEFAULT_AVATAR = 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/avatar_contact.png'

const TMP_DIR = path.join(process.cwd(), 'database', 'tmp')
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true })

const WEB_BASE = () => global.web || global.jereBaseUrl || 'https://api.jerexd.my.id'
const API_KEY = () => global.apikey?.jereapi || global.jereApiKey || ''

const log = (...a) => console.log('[IQC]', ...a)

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

// ── Crop gambar jadi persegi kecil (256x256) ──
function makeSquareAvatar(buffer, size = 256) {
    return new Promise((resolve) => {
        const tmpIn = path.join(TMP_DIR, `iqc_in_${Date.now()}.jpg`);
        const tmpOut = path.join(TMP_DIR, `iqc_out_${Date.now()}.jpg`);
        try { fs.writeFileSync(tmpIn, buffer); } catch { return resolve(buffer); }

        const ff = spawn('ffmpeg', [
            '-y', '-i', tmpIn,
            '-vf', `crop='min(iw,ih)':'min(iw,ih)',scale=${size}:${size}:flags=lanczos`,
            '-q:v', '3', '-frames:v', '1', tmpOut
        ]);

        ff.on('close', (code) => {
            try { fs.unlinkSync(tmpIn); } catch {}
            if (code !== 0) {
                try { fs.unlinkSync(tmpOut); } catch {}
                return resolve(buffer);
            }
            try {
                const out = fs.readFileSync(tmpOut);
                fs.unlinkSync(tmpOut);
                resolve(out.length > 100 ? out : buffer);
            } catch {
                resolve(buffer);
            }
        });

        ff.on('error', () => {
            try { fs.unlinkSync(tmpIn); } catch {}
            resolve(buffer);
        });
    });
}

// ── Upload gambar ke Catbox.moe (Lebih stabil dari uguu.se) ──
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
    command: ['iqc', 'iphone-qc'],
    category: 'maker',
    execute: async (denn, m, { prefix, command, text }) => {
        const key = API_KEY()
        if (!key) return m.reply('❌ API key kosong. Set `jereApiKey` di settings.js')

        const who = m.mentionedJid?.[0] || m.quoted?.sender || (m.key.fromMe ? denn.user?.id : m.sender)

        let imgMsg = null
        if (m.quoted?.msg && typeof m.quoted.msg.mimetype === 'string' && m.quoted.msg.mimetype.startsWith('image/')) {
            imgMsg = m.quoted.msg
        } else if (m.mtype === 'imageMessage' && typeof m.msg?.mimetype === 'string' && m.msg.mimetype.startsWith('image/')) {
            imgMsg = m.msg
        }

        const inputText = m.quoted?.text || text || ''
        if (!inputText && !imgMsg) {
            return m.reply(
                `📱 *IPHONE QUOTE CHAT*\n\n` +
                `📌 *Contoh:*\n` +
                `• \`${prefix}${command} Halo dunia\`\n` +
                `• \`${prefix}${command} Halo dunia|light\` _(pilih tema)_\n` +
                `• Reply gambar + \`${prefix}${command}\`\n` +
                `• Tag orang + \`${prefix}${command} Hai\` _(ambil PP)_`
            )
        }

        let msgText = inputText
        let theme = 'dark'
        const splitIdx = inputText.indexOf('|')
        if (splitIdx !== -1) {
            msgText = inputText.slice(0, splitIdx).trim()
            theme = inputText.slice(splitIdx + 1).trim() || 'dark'
        }

        const timeNow = new Intl.DateTimeFormat('id-ID', {
            timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false
        }).format(new Date()).replace(':', '.')

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

            // 3. Crop + Upload
            let imageUrl = ''
            if (imageBuffer && imageBuffer.length > 1024 && isImageBuf(imageBuffer)) {
                try {
                    const squareImage = await makeSquareAvatar(imageBuffer);
                    imageUrl = await uploadImage(squareImage, `iqc_${Date.now()}.jpg`)
                    log('uploaded:', imageUrl)
                } catch (e) {
                    log('upload gagal:', e.message)
                }
            }

            // Fallback URL jika upload gambar gagal / kosong
            if (!imageUrl) {
                log('menggunakan default avatar')
                imageUrl = DEFAULT_AVATAR
            }

            // 4. Panggil API Jere
            await m.reply('🎨 Membuat IQC...')
            const params = {
                apikey: key,
                text: msgText || ' ',
                time: timeNow,
                theme,
                url: imageUrl
            }

            let res
            try {
                res = await withTimeout(axios.get(`${WEB_BASE()}/api/maker/iqc`, {
                    params,
                    responseType: 'arraybuffer',
                    timeout: T_API,
                    maxContentLength: 20 * 1024 * 1024,
                    headers: { 'User-Agent': UA },
                    validateStatus: () => true
                }), T_API + 5000, 'iqc-api')
            } catch (e) {
                log('api fetch err:', e.message)
                return m.reply(`❌ Gagal menghubungi server IQC.\n\n_${e.message}_`)
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
                return m.reply(`❌ API Error: ${json.error || json.message || json.msg || 'Gagal memproses IQC'}`);
            }

            if (res.status >= 400) {
                return m.reply(`❌ Server IQC error (HTTP ${res.status})`)
            }

            if (outBuf.length < 1024 || isHtml(outBuf) || !isImageBuf(outBuf)) {
                return m.reply('❌ Hasil bukan gambar valid. Server mengembalikan format yang salah.')
            }

            // 6. Kirim Hasil
            const caption =
                `✅ *IQC BERHASIL DIBUAT*\n\n` +
                `✉️ *Chat:* ${msgText}\n` +
                `🎨 *Tema:* ${theme}\n` +
                `⏰ *Jam:* ${timeNow} WIB\n` +
                `✨ *Req:* ${m.pushName || 'User'}`

            try {
                await denn.sendMessage(m.chat, { image: outBuf, caption }, { quoted: m })
            } catch (e) {
                log('send image err:', e.message)
                await denn.sendMessage(m.chat, {
                    document: outBuf,
                    mimetype: 'image/png',
                    fileName: `iqc_${Date.now()}.png`,
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