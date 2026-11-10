import axios from 'axios'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const MAX_IMAGE = 15 * 1024 * 1024
const T_API = 15000
const T_DL = 30000
const T_GLOBAL = 60000

const WEB_BASE = () => global.web || global.jereBaseUrl || 'https://api.jerexd.my.id'
const API_KEY = () => global.apikey?.jereapi || global.jereApiKey || ''

const log = (...a) => console.log('[Pixiv]', ...a)

const isValidUrl = (u) => typeof u === 'string' && /^https?:\/\//i.test(u)

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

function pickImageUrls(item) {
    if (!item || typeof item !== 'object') return []
    const out = new Set()

    const push = (v) => { if (isValidUrl(v)) out.add(v) }

    if (Array.isArray(item.Images)) item.Images.forEach(push)
    if (Array.isArray(item.images)) item.images.forEach(push)
    if (Array.isArray(item.urls)) item.urls.forEach(u => push(typeof u === 'string' ? u : u?.url))

    push(item.image)
    push(item.url)
    push(item.img)
    push(item.cover)
    push(item.thumbnail)
    push(item.original)

    if (item.meta_pages && Array.isArray(item.meta_pages)) {
        for (const page of item.meta_pages) {
            if (page?.image_urls) {
                if (page.image_urls.original) push(page.image_urls.original)
                if (page.image_urls.large) push(page.image_urls.large)
                if (page.image_urls.medium) push(page.image_urls.medium)
            }
        }
    }

    return [...out]
}

const pickMeta = (item, fallbackQuery) => {
    const i = item || {}
    return {
        title: i.Title || i.title || i.name || fallbackQuery,
        author: i.Author || i.author || i.userName || i.user?.name || i.artist || '-',
        likes: i.Stats?.Likes ?? i.likeCount ?? i.likes ?? 0,
        bookmarks: i.Stats?.Bookmarks ?? i.bookmarkCount ?? i.bookmarks ?? 0,
        views: i.Stats?.Views ?? i.viewCount ?? i.views ?? 0,
        tags: Array.isArray(i.Tags) ? i.Tags.join(', ') : (i.Tags || i.tags || ''),
        id: i.Id || i.id || null
    }
}

async function fetchJson(url, label) {
    const res = await withTimeout(axios.get(url, {
        timeout: T_API,
        headers: { 'User-Agent': UA },
        validateStatus: () => true
    }), T_API + 3000, label)

    if (res.status >= 400) throw new Error(`HTTP ${res.status}`)
    if (!res.data) throw new Error('Response kosong')
    return res.data
}

async function searchJere(query) {
    const key = API_KEY()
    if (!key) return null
    try {
        const data = await fetchJson(
            `${WEB_BASE()}/api/search/pixiv?apikey=${key}&query=${encodeURIComponent(query)}&type=artworks`,
            'pixiv-search'
        )
        if (!data?.status) { log('jere status=false'); return null }
        const list = Array.isArray(data.result) ? data.result : (data.result ? [data.result] : [])
        if (!list.length) { log('jere 0 result'); return null }

        const items = list.slice(0, 5).map(it => {
            const urls = pickImageUrls(it)
            return { raw: it, meta: pickMeta(it, query), urls }
        }).filter(x => x.urls.length)

        if (!items.length) { log('jere 0 url valid'); return null }
        log('jere ✓', items.length, 'artikel')
        return { items, source: 'Jere' }
    } catch (e) {
        log('jere err:', e.message)
        return null
    }
}

async function searchBtch(query) {
    const base = global.baseBtch || 'https://btch-downloader-api-green.vercel.app'
    try {
        const data = await fetchJson(
            `${base}/api/search/pixiv?query=${encodeURIComponent(query)}`,
            'btch-pixiv'
        )
        if (!data) return null
        const list = Array.isArray(data.result) ? data.result : (data.result ? [data.result] : [])
        if (!list.length) return null

        const items = list.slice(0, 5).map(it => {
            const urls = pickImageUrls(it)
            return { raw: it, meta: pickMeta(it, query), urls }
        }).filter(x => x.urls.length)

        if (!items.length) return null
        log('btch ✓', items.length, 'artikel')
        return { items, source: 'BTCH' }
    } catch (e) {
        log('btch err:', e.message)
        return null
    }
}

const searchSources = [searchJere, searchBtch]

async function searchPixiv(query) {
    const errors = []
    for (const fn of searchSources) {
        try {
            const r = await fn(query)
            if (r && r.items.length) return r
        } catch (e) {
            errors.push(`${fn.name}: ${e.message}`)
        }
    }
    throw new Error(errors[0] || `Tidak ada hasil untuk "${query}"`)
}

async function fetchImageBuf(url) {
    if (!isValidUrl(url)) throw new Error('URL tidak valid')
    const strategies = [
        { label: 'pixiv-ref', headers: { 'User-Agent': UA, 'Referer': 'https://www.pixiv.net/', 'Accept': 'image/*,*/*' } },
        { label: 'no-ref', headers: { 'User-Agent': UA, 'Accept': 'image/*,*/*' } }
    ]

    let lastErr
    for (const s of strategies) {
        try {
            const res = await withTimeout(axios.get(url, {
                responseType: 'arraybuffer',
                timeout: T_DL,
                maxContentLength: MAX_IMAGE,
                maxRedirects: 10,
                headers: s.headers,
                validateStatus: () => true
            }), T_DL + 3000, `dl-${s.label}`)

            const buf = Buffer.from(res.data || [])
            if (res.status >= 400) { lastErr = new Error(`HTTP ${res.status} (${s.label})`); continue }
            if (buf.length < 1024) { lastErr = new Error(`Buffer kecil (${s.label})`); continue }
            if (isHtml(buf)) { lastErr = new Error(`HTML (${s.label})`); continue }
            if (!isImageBuf(buf)) { lastErr = new Error(`Bukan gambar (${s.label})`); continue }
            return buf
        } catch (e) {
            lastErr = new Error(`${s.label}: ${e.message}`)
        }
    }
    throw lastErr || new Error('Semua fetch gagal')
}

const buildCaption = (meta, idx, total, source) => {
    const lines = [`🎨 *PIXIV ARTWORK*`]
    if (total > 1) lines.push(`📎 *${idx + 1}/${total}*`)
    lines.push('')
    lines.push(`📌 *Judul:* ${meta.title}`)
    lines.push(`👤 *Artist:* ${meta.author}`)
    if (meta.likes || meta.bookmarks || meta.views) {
        lines.push(`📊 *Stats:* ❤️ ${meta.likes} · ⭐ ${meta.bookmarks} · 👁️ ${meta.views}`)
    }
    if (meta.tags) lines.push(`🏷️ *Tags:* ${String(meta.tags).slice(0, 200)}`)
    if (meta.id) lines.push(`🔗 *Link:* https://www.pixiv.net/artworks/${meta.id}`)
    lines.push(`⚙️ *Sumber:* ${source}`)
    return lines.join('\n')
}

async function sendOne(denn, m, item, idx, total, source) {
    const caption = buildCaption(item.meta, idx, total, source)

    for (const url of item.urls) {
        try {
            const buf = await fetchImageBuf(url)
            try {
                await denn.sendMessage(m.chat, {
                    image: buf,
                    caption
                }, { quoted: idx === 0 ? m : undefined })
                return true
            } catch (e) {
                log(`send image[${idx}] err:`, e.message)
            }

            if (buf.length <= MAX_IMAGE * 4) {
                try {
                    await denn.sendMessage(m.chat, {
                        document: buf,
                        mimetype: 'image/jpeg',
                        fileName: `pixiv_${meta_safe(item.meta.id) || Date.now()}_${idx}.jpg`,
                        caption
                    }, { quoted: idx === 0 ? m : undefined })
                    return true
                } catch (e) {
                    log(`send image doc[${idx}] err:`, e.message)
                }
            }
        } catch (e) {
            log(`fetch image[${idx}] gagal:`, e.message)
        }
    }
    return false
}

const meta_safe = (id) => (id ? String(id).replace(/[^\w-]/g, '').slice(0, 20) : '')

export default {
    command: ['pixiv'],
    category: 'search',
    execute: async (denn, m, { prefix, text }) => {
        if (!text) return m.reply(
            `🎨 *PIXIV ARTWORK SEARCH*\n\n` +
            `📌 *Contoh:*\n` +
            `• \`${prefix}pixiv hatsune miku\`\n` +
            `• \`${prefix}pixiv genshin impact\``
        )

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
            log('=== START ===', text.trim())

            await updateWait(`🔍 Mencari "${text.trim()}" di Pixiv...`)

            let result
            try {
                result = await searchPixiv(text.trim())
            } catch (e) {
                log('search err:', e.message)
                await finish(`❌ ${e.message}`)
                return
            }

            const { items, source } = result
            log(`Total ${items.length} hasil dari ${source}`)

            let sentCount = 0
            for (let i = 0; i < items.length; i++) {
                await updateWait(`📤 Mengirim ${i + 1}/${items.length}...`)
                const ok = await sendOne(denn, m, items[i], i, items.length, source)
                if (ok) sentCount++
            }

            await deleteWait()

            if (sentCount === 0) {
                await m.reply(
                    `❌ Gagal mengirim gambar dari Pixiv.\n\n` +
                    `_Kemungkinan server gambar memblokir atau gambar sudah dihapus._`
                )
            } else if (sentCount < items.length) {
                await m.reply(`⚠️ Hanya ${sentCount}/${items.length} gambar terkirim.`)
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