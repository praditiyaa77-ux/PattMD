import axios from 'axios'
import yts from 'yt-search'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const LIMIT_VIDEO = 60 * 1024 * 1024
const LIMIT_AUDIO = 20 * 1024 * 1024
const LIMIT_DOC = 100 * 1024 * 1024
const MAX_DOWNLOAD = LIMIT_DOC + 20 * 1024 * 1024

const T_API = 10000
const T_DL = 90000
const T_GLOBAL = 75000

const WEB_BASE = () => global.web || global.jereBaseUrl || 'https://api.jerexd.my.id'
const API_KEY = () => global.apikey?.jereapi || global.jereApiKey || ''

const log = (...a) => console.log('[Play]', ...a)

const isValidUrl = (u) => typeof u === 'string' && /^https?:\/\//i.test(u)

const isHtml = (buf) => {
    if (!buf || buf.length < 16) return true
    const head = buf.slice(0, 512).toString('utf8').toLowerCase()
    return head.includes('<!doctype') || head.includes('<html') || head.includes('<body')
}

const safeTitle = (t) => String(t || 'media').replace(/[\\/:*?"<>|\n\r]/g, '').slice(0, 60).trim() || 'media'

const withTimeout = (promise, ms, label = 'op') => {
    let t
    const timeout = new Promise((_, rej) => {
        t = setTimeout(() => rej(new Error(`${label} timeout ${ms}ms`)), ms)
    })
    return Promise.race([promise, timeout]).finally(() => clearTimeout(t))
}

function pickAllUrls(obj) {
    if (!obj || typeof obj !== 'object') return []
    const out = new Set()
    function walk(o, d = 0) {
        if (d > 3 || !o || typeof o !== 'object') return
        if (Array.isArray(o)) { for (const v of o) walk(v, d + 1); return }
        for (const [k, v] of Object.entries(o)) {
            if (isValidUrl(v) && /(url|link|download|audio|video|mp3|mp4|hd|play)/i.test(k)) out.add(v)
            else if (v && typeof v === 'object') walk(v, d + 1)
        }
    }
    walk(obj)
    return [...out]
}

const pickMeta = (data, raw) => {
    const d = data || {}, r = raw || {}
    const id = d.id || d.video_id || d.videoId || r.id || ''
    return {
        title: d.title || r.title || 'YouTube Media',
        author: d.channel || d.author || d.channel?.name || r.channel || r.author || 'YouTube',
        duration: d.duration || r.duration || '-',
        thumbnail: d.thumbnail || r.thumbnail || (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '')
    }
}

async function callApi(path, url, extra = {}) {
    try {
        const res = await withTimeout(axios.get(`${WEB_BASE()}${path}`, {
            params: { apikey: API_KEY(), url, ...extra },
            timeout: T_API,
            headers: { 'User-Agent': UA },
            validateStatus: () => true
        }), T_API + 2000, path)

        if (res.status >= 400) { log(`${path} HTTP ${res.status}`); return null }
        if (!res.data?.status) { log(`${path} status=false`); return null }
        const data = res.data.result || res.data.data || res.data
        const urls = pickAllUrls(data)
        if (!urls.length) { log(`${path} 0 url`); return null }
        log(`${path} ✓ ${urls.length} url (fmt=${extra.format || '-'})`)
        return { urls, meta: pickMeta(data, res.data) }
    } catch (e) {
        log(`${path} err: ${e.message}`)
        return null
    }
}

async function fetchBtch(url, type) {
    const endpoint = type === 'video'
        ? 'https://btch-downloader-api-green.vercel.app/api/download/ytmp4'
        : 'https://btch-downloader-api-green.vercel.app/api/download/ytmp3'
    try {
        const res = await withTimeout(axios.get(`${endpoint}?url=${encodeURIComponent(url)}`, {
            timeout: T_API, headers: { 'User-Agent': UA }
        }), T_API + 2000, `btch-${type}`)
        const n = res.data?.normalized
        if (!n) return null
        const urls = (Array.isArray(n.media) ? n.media : []).map(m => m.url || m.downloadUrl).filter(isValidUrl)
        if (!urls.length) return null
        log(`btch-${type} ✓ ${urls.length} url`)
        return {
            urls,
            meta: {
                title: n.title || 'YouTube Media',
                author: n.author || 'YouTube',
                duration: n.duration || '-',
                thumbnail: n.thumbnail || ''
            }
        }
    } catch (e) {
        log(`btch-${type} err: ${e.message}`)
        return null
    }
}

async function downloadFrom(urls, minSize = 20 * 1024) {
    if (!Array.isArray(urls) || !urls.length) return null
    for (let i = 0; i < urls.length; i++) {
        try {
            const res = await withTimeout(axios.get(urls[i], {
                responseType: 'arraybuffer',
                timeout: T_DL,
                maxContentLength: MAX_DOWNLOAD,
                maxRedirects: 10,
                headers: { 'User-Agent': UA, 'Accept': '*/*' },
                validateStatus: () => true
            }), T_DL + 5000, `dl[${i}]`)

            const buf = Buffer.from(res.data || [])
            if (res.status >= 400) { log(`dl[${i}] HTTP ${res.status}`); continue }
            if (buf.length < minSize) { log(`dl[${i}] kecil ${buf.length}B`); continue }
            if (isHtml(buf)) { log(`dl[${i}] HTML`); continue }
            log(`dl[${i}] ✓ ${(buf.length / 1024 / 1024).toFixed(2)}MB`)
            return buf
        } catch (e) {
            log(`dl[${i}] err: ${e.message}`)
        }
    }
    return null
}

async function sendVideo(denn, m, buf, fileName, caption, meta, srcUrl) {
    if (buf.length <= LIMIT_VIDEO) {
        try {
            await denn.sendMessage(m.chat, {
                video: buf, mimetype: 'video/mp4', fileName, caption,
                contextInfo: { externalAdReply: {
                    title: meta.title.slice(0, 60),
                    body: `${meta.author} · Video`,
                    mediaType: 1, renderLargerThumbnail: true,
                    thumbnailUrl: meta.thumbnail || undefined,
                    sourceUrl: srcUrl, mediaUrl: srcUrl
                }}
            }, { quoted: m })
            return true
        } catch (e) { log('send video:', e.message) }
    }
    if (buf.length <= LIMIT_DOC) {
        try {
            await denn.sendMessage(m.chat, {
                document: buf, mimetype: 'video/mp4', fileName, caption
            }, { quoted: m })
            return true
        } catch (e) { log('send video doc:', e.message) }
    }
    return false
}

async function sendAudio(denn, m, buf, fileName, caption, meta, srcUrl) {
    if (buf.length <= LIMIT_AUDIO) {
        try {
            await denn.sendMessage(m.chat, {
                audio: buf, mimetype: 'audio/mpeg', ptt: false, fileName,
                contextInfo: { externalAdReply: {
                    title: meta.title.slice(0, 60),
                    body: `${meta.author} · Audio`,
                    mediaType: 1, renderLargerThumbnail: true,
                    thumbnailUrl: meta.thumbnail || undefined,
                    sourceUrl: srcUrl, mediaUrl: srcUrl
                }}
            }, { quoted: m })
            return true
        } catch (e) { log('send audio:', e.message) }
    }
    if (buf.length <= LIMIT_DOC) {
        try {
            await denn.sendMessage(m.chat, {
                document: buf, mimetype: 'audio/mpeg', fileName, caption
            }, { quoted: m })
            return true
        } catch (e) { log('send audio doc:', e.message) }
    }
    return false
}

async function searchYoutube(query) {
    try {
        const r = await withTimeout(yts(query), 10000, 'yts')
        if (r?.videos?.length) return r.videos.slice(0, 5)
    } catch (e) { log('yts err:', e.message) }

    try {
        const res = await withTimeout(axios.get(`${WEB_BASE()}/api/search/youtube`, {
            params: { apikey: API_KEY(), q: query },
            timeout: T_API, headers: { 'User-Agent': UA }
        }), T_API + 2000, 'search')
        if (res.data?.status && Array.isArray(res.data.result)) {
            return res.data.result.slice(0, 5).map(v => ({
                title: v.title,
                author: { name: v.channel || 'YouTube' },
                timestamp: v.duration || '-',
                views: 0,
                thumbnail: v.imageUrl || '',
                url: v.link || `https://youtube.com/watch?v=${v.id}`
            }))
        }
    } catch (e) { log('search fallback err:', e.message) }
    return []
}

async function fetchAll(youtubeUrl) {
    const audioEndpoints = [
        { path: '/api/downloader/youtube', extra: { format: 'mp3' } },
        { path: '/api/downloader/ytmp3', extra: {} }
    ]
    const videoEndpoints = [
        { path: '/api/downloader/ytmp4', extra: {} },
        { path: '/api/downloader/youtube', extra: { format: 'mp4' } }
    ]

    const [audioRes, videoRes] = await Promise.all([
        (async () => {
            for (const ep of audioEndpoints) {
                const r = await callApi(ep.path, youtubeUrl, ep.extra)
                if (r) return r
            }
            return await fetchBtch(youtubeUrl, 'audio')
        })(),
        (async () => {
            for (const ep of videoEndpoints) {
                const r = await callApi(ep.path, youtubeUrl, ep.extra)
                if (r) return r
            }
            return await fetchBtch(youtubeUrl, 'video')
        })()
    ])

    const audioSources = audioRes?.urls || []
    const videoSources = videoRes?.urls || []
    const meta = videoRes?.meta || audioRes?.meta || { title: 'YouTube Media', author: 'YouTube', duration: '-', thumbnail: '' }

    log(`RESULT: audio=${audioSources.length} video=${videoSources.length}`)
    return { audioSources, videoSources, meta }
}

export default {
    command: ['play'],
    category: 'downloader',
    execute: async (denn, m, { prefix, text }) => {
        if (!text) return m.reply(
            `🎵 *YOUTUBE PLAY*\n\n` +
            `• \`${prefix}play <judul>\`\n` +
            `• \`${prefix}play <link youtube>\`\n\n` +
            `💡 Contoh:\n\`${prefix}play lofi hip hop\``
        )

        let waitMsg
        try {
            waitMsg = await m.reply(global.msg.wait)
        } catch (_) {}

        const updateWait = async (newText) => {
            if (!waitMsg?.key?.id) return
            try {
                await denn.sendMessage(m.chat, { text: newText, edit: waitMsg.key })
            } catch (_) {}
        }

        const finish = async (msgText) => {
            if (waitMsg?.key?.id) {
                try { await denn.sendMessage(m.chat, { delete: waitMsg.key }) } catch (_) {}
            }
            try { await m.reply(msgText) } catch (_) {}
        }

        const task = (async () => {
            log('=== START ===')

            let targetUrl = null
            if (/youtube\.com|youtu\.be/i.test(text)) {
                targetUrl = text.trim()
            } else {
                await updateWait('🔍 Mencari lagu...')
                const results = await searchYoutube(text.trim())
                if (!results.length) {
                    await finish(`❌ Tidak ditemukan lagu untuk: *${text}*`)
                    return
                }
                targetUrl = results[0].url
                log('Selected:', results[0].title)
            }

            await updateWait('📡 Mengambil info media...')
            const { audioSources, videoSources, meta } = await fetchAll(targetUrl)
            const baseName = safeTitle(meta.title)

            log('Meta:', meta.title, '| audio:', audioSources.length, '| video:', videoSources.length)

            let videoBuf = null
            let audioBuf = null

            if (videoSources.length) {
                await updateWait('⏬ Mengunduh video...')
                videoBuf = await downloadFrom(videoSources, 100 * 1024)
            }

            if (audioSources.length) {
                await updateWait('⏬ Mengunduh audio...')
                audioBuf = await downloadFrom(audioSources, 20 * 1024)
            }

            if (!videoBuf && !audioBuf) {
                log('Semua download gagal')
                const lines = [`🎵 *${meta.title}*`, `👤 ${meta.author}`, `⏱️ ${meta.duration}`, '']
                if (videoSources[0]) lines.push(`🎬 *Video:* ${videoSources[0]}`)
                if (audioSources[0]) lines.push(`🎵 *Audio:* ${audioSources[0]}`)
                if (!videoSources.length && !audioSources.length) {
                    lines.push('❌ *API tidak mengembalikan link media.*\nCek `global.jereApiKey` di settings.js')
                } else {
                    lines.push('⚠️ *File gagal diunduh. Buka link manual di atas.*')
                }
                await finish(lines.join('\n'))
                return
            }

            let videoSent = false
            let audioSent = false

            if (videoBuf) {
                await updateWait('📤 Mengirim video...')
                const size = (videoBuf.length / 1024 / 1024).toFixed(2)
                const cap = `🎬 *${meta.title}*\n👤 *${meta.author}*\n⏱️ *${meta.duration}*\n📦 *${size} MB*\n✨ *Req:* ${m.pushName || 'User'}`
                videoSent = await sendVideo(denn, m, videoBuf, `${baseName}.mp4`, cap, meta, targetUrl)
            }

            if (audioBuf) {
                await updateWait('📤 Mengirim audio...')
                const size = (audioBuf.length / 1024 / 1024).toFixed(2)
                const cap = `🎵 *${meta.title}*\n👤 *${meta.author}*\n⏱️ *${meta.duration}*\n📦 *${size} MB*\n✨ *Req:* ${m.pushName || 'User'}`
                audioSent = await sendAudio(denn, m, audioBuf, `${baseName}.mp3`, cap, meta, targetUrl)
            }

            if (waitMsg?.key?.id) {
                try { await denn.sendMessage(m.chat, { delete: waitMsg.key }) } catch (_) {}
            }

            if (!videoSent && !audioSent) {
                log('Send gagal total')
                const lines = [`🎵 *${meta.title}*`, `👤 ${meta.author}`, '']
                if (videoSources[0]) lines.push(`🎬 Video: ${videoSources[0]}`)
                if (audioSources[0]) lines.push(`🎵 Audio: ${audioSources[0]}`)
                lines.push('', '⚠️ *File terlalu besar atau gagal dikirim.* Buka manual.')
                await m.reply(lines.join('\n'))
            }
        })()

        try {
            await withTimeout(task, T_GLOBAL, 'global')
        } catch (e) {
            log('GLOBAL TIMEOUT:', e.message)
            await finish(`⏱️ *Timeout ${T_GLOBAL / 1000}s* — server API terlalu lambat.\n\nCoba lagi, atau pakai link langsung dari YouTube.`)
        }
    }
}