import axios from 'axios'
import { fetchTermai } from '../../lib/helper.js'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const MAX_BYTES = 100 * 1024 * 1024

const isValidUrl = (u) => typeof u === 'string' && /^https?:\/\//i.test(u)

const isHtmlBody = (buf) => {
    if (!buf || buf.length < 16) return true
    const head = buf.slice(0, 512).toString('utf8').toLowerCase()
    return head.includes('<!doctype html') || head.includes('<html') || head.includes('<body')
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

const fetchBuffer = async (url, referer = 'https://www.tiktok.com/') => {
    if (!isValidUrl(url)) throw new Error('URL tidak valid')
    const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        maxContentLength: MAX_BYTES,
        headers: { 'User-Agent': UA, 'Referer': referer, 'Accept': '*/*' }
    })
    const buffer = Buffer.from(res.data)
    if (buffer.length < 1024) throw new Error('Buffer terlalu kecil')
    if (isHtmlBody(buffer)) throw new Error('Server mengembalikan HTML, bukan media')
    return { buffer, contentType: res.headers['content-type'] || '' }
}

const extractTermai = async (url) => {
    const data = await fetchTermai('/downloader/tiktok', { url })
    if (!data) return null

    let video = null
    let audio = null
    const images = []

    if (Array.isArray(data.media)) {
        for (const item of data.media) {
            const u = typeof item === 'string' ? item : (item.url || item.link || item.download)
            if (!isValidUrl(u)) continue
            if (/\.(jpg|jpeg|png|webp)(\?|$)/i.test(u)) images.push(u)
            else if (!video) video = u
        }
    } else if (typeof data.media === 'string') {
        video = data.media
    } else if (data.media && typeof data.media === 'object') {
        video = data.media.url || data.media.link || data.media.video
    }

    if (Array.isArray(data.images)) {
        for (const it of data.images) {
            const u = typeof it === 'string' ? it : (it.url || it.link)
            if (isValidUrl(u)) images.push(u)
        }
    }

    if (Array.isArray(data.image_post_info?.images)) {
        for (const it of data.image_post_info.images) {
            const u = it.display_image?.url_list?.[0]
            if (isValidUrl(u)) images.push(u)
        }
    }

    audio = data.music?.play || data.music?.url || data.audio?.url || null

    if (!video && data.type === 'video' && isValidUrl(data.url)) video = data.url
    if (!video && !images.length) return null

    return {
        video: isValidUrl(video) ? video : null,
        images,
        audio: isValidUrl(audio) ? audio : null,
        author: data.author?.nickname || data.author?.unique_id || 'Unknown',
        title: data.title || 'TikTok Video',
        source: 'Termai'
    }
}

const extractTikwm = async (url) => {
    const res = await axios.get('https://www.tikwm.com/api/', {
        params: { url, hd: 1 },
        timeout: 20000,
        headers: { 'User-Agent': UA }
    })
    const d = res.data
    if (!d || d.code !== 0 || !d.data) return null

    const data = d.data
    const images = Array.isArray(data.images) ? data.images.filter(isValidUrl) : []

    let video = null
    if (isValidUrl(data.hdplay)) video = data.hdplay
    else if (isValidUrl(data.play)) video = data.play

    if (!video && !images.length) return null

    return {
        video,
        images,
        audio: isValidUrl(data.music) ? data.music : null,
        author: data.author?.nickname || data.author?.unique_id || 'Unknown',
        title: data.title || 'TikTok Video',
        source: 'TikWM'
    }
}

const extractBtch = async (url) => {
    const base = global.baseBtch || null
    if (!base) return null
    const key = global.btchApiKey || ''

    try {
        const res = await axios.get(`${base}/api/dowloader/tiktok`, {
            params: { url, apikey: key },
            timeout: 20000,
            headers: { 'User-Agent': UA }
        })
        const d = res.data
        if (!d || d.status !== true) return null

        const r = d.result || d.data
        if (!r) return null

        let video = null
        if (isValidUrl(r.video)) video = r.video
        else if (isValidUrl(r.video_hd)) video = r.video_hd
        else if (isValidUrl(r.play)) video = r.play

        const images = Array.isArray(r.images) ? r.images.filter(isValidUrl) : []
        if (!video && !images.length) return null

        return {
            video,
            images,
            audio: isValidUrl(r.audio || r.music) ? (r.audio || r.music) : null,
            author: r.author || 'Unknown',
            title: r.title || r.desc || 'TikTok Video',
            source: 'BTCH'
        }
    } catch (_) {
        return null
    }
}

const extractors = [extractTermai, extractTikwm, extractBtch]

const resolveMedia = async (url) => {
    const errors = []

    for (const fn of extractors) {
        let data
        try {
            data = await fn(url)
        } catch (e) {
            errors.push(`${fn.name}: ${e.message}`)
            continue
        }
        if (!data) continue

        if (data.video) {
            try {
                const { buffer, contentType } = await fetchBuffer(data.video)
                const kind = detectKind(buffer, contentType)
                if (kind === 'video' && buffer.length > 10 * 1024) {
                    return { type: 'video', buffer, data }
                }
                throw new Error(`Bukan video (${kind})`)
            } catch (e) {
                errors.push(`${fn.name} video: ${e.message}`)
            }
        }

        if (data.images.length) {
            const buffers = []
            for (const u of data.images) {
                try {
                    const { buffer, contentType } = await fetchBuffer(u)
                    if (detectKind(buffer, contentType) === 'image') buffers.push(buffer)
                } catch (_) {}
            }
            if (buffers.length) {
                return { type: 'images', buffers, data }
            }
            errors.push(`${fn.name} images: semua gagal diunduh`)
        }
    }

    throw new Error(errors[0] || 'Semua sumber gagal')
}

export default {
    command: ['tiktok', 'tt'],
    category: 'downloader',
    execute: async (denn, m, { prefix, text }) => {
        if (!text) return m.reply(`Contoh: ${prefix}tiktok https://vt.tiktok.com/xxx`)
        if (!text.includes('tiktok.com')) return m.reply('❌ URL tidak valid. Pastikan menggunakan link TikTok!')

        await m.reply(global.msg.wait)

        let resolved
        try {
            resolved = await resolveMedia(text.trim())
        } catch (e) {
            console.log('[TikTok] resolve error:', e.message)
            return m.reply(`❌ Gagal mengunduh TikTok.\n\n_${e.message}_`)
        }

        const { type, buffer, buffers, data } = resolved
        const caption = `🎵 *TIKTOK DOWNLOADER*\n\n👤 *Author:* ${data.author}\n📝 *Title:* ${data.title}\n⚙️ *Sumber:* ${data.source}`

        if (type === 'video') {
            try {
                await denn.sendMessage(m.chat, {
                    video: buffer,
                    mimetype: 'video/mp4',
                    caption
                }, { quoted: m })
                return
            } catch (e) {
                console.log('[TikTok] send video gagal:', e.message)

                try {
                    await denn.sendMessage(m.chat, {
                        document: buffer,
                        mimetype: 'video/mp4',
                        fileName: `tiktok_${Date.now()}.mp4`,
                        caption: `${caption}\n\n_(dikirim sebagai dokumen karena ukuran/kodek)_`
                    }, { quoted: m })
                    return
                } catch (e2) {
                    console.log('[TikTok] send document gagal:', e2.message)
                }

                if (data.audio) {
                    try {
                        const { buffer: abuf, contentType } = await fetchBuffer(data.audio)
                        if (detectKind(abuf, contentType) === 'audio') {
                            return denn.sendMessage(m.chat, {
                                audio: abuf,
                                mimetype: 'audio/mp4',
                                ptt: false
                            }, { quoted: m })
                        }
                    } catch (_) {}
                }

                return m.reply('❌ Gagal mengirim video ke WhatsApp.')
            }
        }

        if (type === 'images') {
            let sent = 0
            for (let i = 0; i < buffers.length; i++) {
                try {
                    await denn.sendMessage(m.chat, {
                        image: buffers[i],
                        caption: i === 0
                            ? `${caption}\n\n📸 Slide 1/${buffers.length}`
                            : `📸 Slide ${i + 1}/${buffers.length}`
                    }, { quoted: i === 0 ? m : undefined })
                    sent++
                } catch (e) {
                    console.log(`[TikTok] slide ${i + 1} gagal:`, e.message)
                }
            }
            if (sent === 0) return m.reply('❌ Gagal mengirim gambar slide.')
            return
        }

        return m.reply('❌ Tidak ada media yang berhasil diunduh.')
    }
}