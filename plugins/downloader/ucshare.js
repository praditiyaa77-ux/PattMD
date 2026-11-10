// UC Share: metadata + thumbnail + link stream video.
// Pakai: .ucshare <link uc-share.com atau kode share>
import axios from 'axios'

const UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'
const BACKEND = 'https://m-intldrive.ucweb.com/1/clouddrive/share/sharepage/video_preview'
const MAX_VIDEOS = 3
const SEND_LIMIT = 60 * 1024 * 1024 // di atas ini kirim link saja

const formatSize = (b) => {
    if (!b) return '0 B'
    const u = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.min(Math.floor(Math.log(b) / Math.log(1024)), u.length - 1)
    return (b / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1) + ' ' + u[i]
}

const formatDuration = (s) => {
    if (!s) return '-'
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60)
    if (h > 0) return `${h}j ${m}m ${sec}d`
    if (m > 0) return `${m}m ${sec}d`
    return `${sec}d`
}

const formatDate = (ts) => ts ? new Date(ts).toISOString().replace('T', ' ').slice(0, 19) : '-'

const safeDecode = (s) => {
    if (!s) return s
    try { return s.includes('%') ? decodeURIComponent(s) : s } catch { return s }
}

const isVideoFile = (it) =>
    it.obj_category === 'video' ||
    (typeof it.format_type === 'string' && it.format_type.toLowerCase().includes('video')) ||
    /\.(mp4|mov|mkv|avi|webm|3gp|flv|m4v)$/i.test(it.file_name || '')

// Ambil objek JSON window.__INITIAL_PROPS__ dengan menghitung kurung
const extractInitialProps = (html) => {
    const start = html.indexOf('window.__INITIAL_PROPS__')
    if (start === -1) return null
    const b0 = html.indexOf('{', start)
    if (b0 === -1) return null
    let depth = 0, inStr = false, esc = false
    for (let i = b0; i < html.length; i++) {
        const ch = html[i]
        if (inStr) {
            if (esc) esc = false
            else if (ch === '\\') esc = true
            else if (ch === '"') inStr = false
            continue
        }
        if (ch === '"') inStr = true
        else if (ch === '{') depth++
        else if (ch === '}') {
            depth--
            if (depth === 0) {
                try { return JSON.parse(html.slice(b0, i + 1)) } catch { return null }
            }
        }
    }
    return null
}

const findStoken = (html, props) => {
    const d = props?.initialData
    const c = [d?.stokenDetail?.stoken, d?.shareDetail?.stoken, d?.shareDetail?.share?.stoken, d?.shareInfo?.stoken]
    for (const x of c) if (x) return safeDecode(x)
    const m = html.match(/"stoken"\s*:\s*"([^"]+)"/)
    return m ? safeDecode(m[1]) : null
}

const parseFromJson = (props) => {
    const data = props?.initialData
    if (!data) return null
    try {
        const share = data.shareDetail?.share || {}
        const list = data.shareDetail?.list || []
        const files = list.filter(i => !i.dir).map((i, n) => ({
            no: n + 1,
            file_name: i.file_name,
            fid: i.fid,
            size: i.size || 0,
            is_video: isVideoFile(i),
            duration: i.duration || 0,
            resolution: i.video_max_resolution || '-',
            thumbnail: i.thumbnail || null,
            share_fid_token: i.share_fid_token,
        }))
        return {
            share: {
                title: share.title || data.stokenDetail?.title || '-',
                pwd_id: share.pwd_id,
                author: data.stokenDetail?.author?.nick_name || '-',
                file_num: share.file_num || list.length,
                total_size: share.size || 0,
                expired_at: share.expired_at,
                is_permanent: share.expired_type === 1,
            },
            files,
            folders: list.filter(i => i.dir).length,
        }
    } catch { return null }
}

// Fallback tanpa cheerio: hanya judul + nama item
const parseFromHtml = (html) => {
    const t = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]*)"/i)?.[1]
        || html.match(/<title>([^<]*)<\/title>/i)?.[1] || '-'
    const names = [...html.matchAll(/class="item-tit"[^>]*title="([^"]*)"/g)].map(x => x[1])
    return {
        share: { title: t.replace(/ - Pembagian UC Drive/i, '').trim(), author: '-', file_num: names.length },
        files: names.map((n, i) => ({ no: i + 1, file_name: n, is_video: false })),
        folders: 0,
    }
}

const getVideoPreview = async ({ pwd_id, stoken, fid, fid_token, shareUrl }) => {
    const { data } = await axios.get(BACKEND, {
        params: { pr: 'UCBrowser', fr: 'h5', __t: Date.now(), pwd_id, stoken, fid, fid_token },
        headers: {
            'User-Agent': UA,
            'Accept': 'application/json, text/plain, */*',
            'Referer': shareUrl,
            'Origin': 'https://uc-share.com',
        },
        timeout: 15000,
    })
    if (data?.code !== 0 || !data?.data?.play_info?.url) {
        throw new Error(`video_preview gagal (code=${data?.code} ${data?.message || ''})`)
    }
    const p = data.data.play_info
    return {
        url: p.url,
        thumbnail: data.data.preview_url || null,
        resolution: p.width && p.height ? `${p.width}x${p.height}` : '-',
    }
}

// Hanya host uc-share.com yang diizinkan (cegah SSRF ke alamat lain)
const normalizeUrl = (input) => {
    let u = input.trim()
    if (/^[\w-]{6,}$/.test(u)) u = `https://uc-share.com/s/${u}`
    let parsed
    try { parsed = new URL(u) } catch { return null }
    if (parsed.protocol !== 'https:') return null
    if (!/(^|\.)uc-share\.com$/i.test(parsed.hostname)) return null
    parsed.searchParams.set('la', 'id')
    return parsed.toString()
}

export default {
    command: ['ucshare', 'ucs'],
    category: 'downloader',
    execute: async (denn, m, { text, prefix }) => {
        const input = (text || m.quoted?.text || '').trim().split(/\s+/)[0]
        if (!input) return m.reply(`Contoh: ${prefix}ucshare https://uc-share.com/s/6e1505b566c14`)

        const url = normalizeUrl(input)
        if (!url) return m.reply('❌ Hanya link uc-share.com (https) atau kode share yang didukung.')

        await m.reply(global.msg.wait)
        try {
            const { data: html } = await axios.get(url, {
                headers: { 'User-Agent': UA, 'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8' },
                timeout: 15000,
                maxRedirects: 5,
            })

            const props = extractInitialProps(html)
            const info = parseFromJson(props) || parseFromHtml(html)
            const { share, files } = info
            const videos = files.filter(f => f.is_video && f.fid)

            let caption = `📦 *UC SHARE*\n\n` +
                `🏷️ Judul: ${share.title}\n` +
                `👤 Pembagi: ${share.author}\n` +
                `📁 File: ${share.file_num}` + (info.folders ? ` (+${info.folders} folder)` : '') + `\n`
            if (share.total_size) caption += `💾 Total: ${formatSize(share.total_size)}\n`
            if (share.expired_at) caption += `⏳ Kedaluwarsa: ${share.is_permanent ? 'permanen' : formatDate(share.expired_at)}\n`
            caption += `\n` + files.slice(0, 15).map(f =>
                `${f.no}. ${f.file_name}${f.size ? ` (${formatSize(f.size)})` : ''}${f.is_video ? ' 🎬' : ''}`).join('\n')
            if (files.length > 15) caption += `\n…dan ${files.length - 15} file lain`

            const thumb = files.find(f => f.thumbnail)?.thumbnail
            if (thumb) {
                try {
                    await denn.sendMessage(m.chat, { image: { url: thumb }, caption }, { quoted: m })
                } catch { await m.reply(caption) }
            } else {
                await m.reply(caption)
            }

            if (!videos.length) return m.reply('ℹ️ Tidak ada file video yang bisa di-stream.')
            const stoken = findStoken(html, props)
            if (!stoken) return m.reply('⚠️ stoken tidak ditemukan di halaman, video tidak bisa diambil.')
            const pwd_id = share.pwd_id || url.match(/\/s\/([^/?#]+)/)?.[1]

            for (const v of videos.slice(0, MAX_VIDEOS)) {
                try {
                    const pv = await getVideoPreview({ pwd_id, stoken, fid: v.fid, fid_token: v.share_fid_token, shareUrl: url })
                    const cap = `🎬 ${v.file_name}\n⏱️ ${formatDuration(v.duration)} | 📺 ${pv.resolution} | 💾 ${formatSize(v.size)}`
                    if (v.size && v.size > SEND_LIMIT) {
                        await m.reply(`${cap}\n\n⚠️ Terlalu besar untuk dikirim langsung. Link stream:\n${pv.url}`)
                        continue
                    }
                    try {
                        await denn.sendMessage(m.chat, { video: { url: pv.url }, caption: cap, mimetype: 'video/mp4' }, { quoted: m })
                    } catch {
                        await m.reply(`${cap}\n\nGagal kirim langsung. Link stream:\n${pv.url}`)
                    }
                } catch (e) {
                    await m.reply(`❌ ${v.file_name}: ${e.message}`)
                }
            }
            if (videos.length > MAX_VIDEOS) await m.reply(`ℹ️ ${videos.length - MAX_VIDEOS} video lain tidak diproses (batas ${MAX_VIDEOS}).`)
        } catch (e) {
            const st = e.response?.status
            m.reply(`❌ Gagal mengambil data UC Share${st ? ` (HTTP ${st})` : ''}: ${e.message}`)
        }
    }
}
