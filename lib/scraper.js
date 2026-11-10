import axios from 'axios'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const T_API = 15000
const run = promisify(exec)

// ═══════════════════════════════════════════════════════════
//  YOUTUBE
// ═══════════════════════════════════════════════════════════

const YOUTUBE_ID_REGEX =
  /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/

function extractVideoId(url) {
  return String(url || '').match(YOUTUBE_ID_REGEX)?.[1] || null
}

async function fallbackToMp3Buffer(url) {
  const tempDir = path.join(process.cwd(), 'database', 'tmp')
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

  const id = crypto.randomBytes(6).toString('hex')
  const inputPath = path.join(tempDir, `ytfb_${id}.bin`)
  const outputPath = path.join(tempDir, `ytfb_${id}.mp3`)

  try {
    const { data } = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000 })
    const buffer = Buffer.from(data)
    if (!buffer.length) throw new Error('Audio fallback kosong')

    fs.writeFileSync(inputPath, buffer)
    await run(
      `ffmpeg -y -i "${inputPath}" -vn -map_metadata -1 -ac 2 -ar 44100 -c:a libmp3lame -b:a 192k "${outputPath}"`,
      { timeout: 120000 }
    )

    const mp3Buffer = fs.readFileSync(outputPath)
    if (!mp3Buffer.length) throw new Error('Konversi fallback ke MP3 gagal')
    return mp3Buffer
  } finally {
    try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath) } catch {}
    try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath) } catch {}
  }
}

async function ytdl(url, format = 'mp3') {
  try {
    const videoId = extractVideoId(url)
    if (!videoId) return { status: false, mess: 'Format URL tidak dikenali.' }

    const normalizedFormat = String(format || 'mp3').toLowerCase() === 'mp4' ? 'mp4' : 'mp3'

    const client = axios.create({
      timeout: 60000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 16; NX729J) AppleWebKit/537.36',
        Referer: 'https://id.ytmp3.mobi/'
      }
    })

    const { data: init } = await client.get('https://d.ymcdn.org/api/v1/init', {
      params: { p: 'y', 23: '1llum1n471', _: Math.random() }
    })

    if (!init?.convertURL) return { status: false, mess: 'Gagal init server.' }

    const { data: convert } = await client.get(init.convertURL, {
      params: { v: videoId, f: normalizedFormat, _: Math.random() }
    })

    if (!convert?.progressURL || !convert?.downloadURL) return { status: false, mess: 'Gagal data konversi.' }

    let progress = 0
    let attempts = 0
    while (progress < 3 && attempts < 20) {
      const { data } = await client.get(convert.progressURL)
      if ((data?.error || 0) > 0) return { status: false, mess: `Error server: ${data.error}` }
      progress = Number(data?.progress || 0)
      if (progress < 3) {
        attempts++
        await new Promise((r) => setTimeout(r, 250))
      }
    }

    return { status: true, title: convert.title || 'YouTube', dl: convert.downloadURL }
  } catch (e) {
    return { status: false, mess: e.message }
  }
}

class Youtube {
  async download(url, format = 'audio') {
    const outputFormat = ['video', 'mp4'].includes(String(format || 'audio').toLowerCase()) ? 'mp4' : 'mp3'
    const result = await ytdl(url, outputFormat)
    if (!result?.status || !result?.dl) throw new Error(result?.mess || 'Gagal unduh YouTube')
    return { results: { title: result.title, download: result.dl, format: outputFormat } }
  }
}

// ═══════════════════════════════════════════════════════════
//  INSTAGRAM
// ═══════════════════════════════════════════════════════════

async function instagramDownloader(url) {
  const endpoint = 'https://api.azbry.com/api/download/instagramv2'
  const response = await axios.get(endpoint, {
    params: { url },
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  })

  const data = response.data
  if (!data || !data.status || !Array.isArray(data.links) || data.links.length === 0) {
    throw new Error('Gagal mengambil media dari API Instagram')
  }

  const media = data.links.map((item) => {
    const isVideo = String(item.type).toLowerCase().includes('video') || String(item.url).includes('.mp4')
    return { type: isVideo ? 'video' : 'image', url: item.url }
  })

  return { status: true, title: data.links[0]?.text || 'Instagram', media }
}

// ═══════════════════════════════════════════════════════════
//  PINTEREST
// ═══════════════════════════════════════════════════════════

async function scrapePinterest(pinUrl) {
  try {
    const mainPage = await axios.get('https://ilovepin.net/id', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    })
    const cookieString = mainPage.headers['set-cookie'] ? mainPage.headers['set-cookie'].join('; ') : ''

    // Menggunakan URLSearchParams bawaan Node.js (pengganti 'qs')
    const dataBody = new URLSearchParams({ url: pinUrl }).toString()

    const { data } = await axios.post('https://ilovepin.net/proxy.php', dataBody, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        Origin: 'https://ilovepin.net',
        Referer: 'https://ilovepin.net/id',
        Cookie: cookieString
      }
    })

    if (!data.api || data.api.status !== 'OK') return null
    const items = data.api.mediaItems || []
    const media = []

    items.filter(i => i.type === 'Video').forEach(v => media.push({ type: 'video', url: v.mediaUrl }))
    items.filter(i => i.type === 'Image').forEach(v => media.push({ type: 'image', url: v.mediaUrl }))

    return { title: data.api.title || 'Pinterest', media }
  } catch (e) {
    return null
  }
}

// ═══════════════════════════════════════════════════════════
//  AIO (all-in-one)
// ═══════════════════════════════════════════════════════════

const PLATFORM_DETECT = [
  { key: 'instagram', patterns: ['instagram.com'] },
  { key: 'youtube', patterns: ['youtube.com', 'youtu.be'] },
  { key: 'tiktok', patterns: ['tiktok.com', 'vt.tiktok.com'] },
  { key: 'facebook', patterns: ['facebook.com', 'fb.watch', 'fb.com'] },
  { key: 'pinterest', patterns: ['pinterest.com', 'pin.it'] },
  { key: 'capcut', patterns: ['capcut.com'] },
  { key: 'twitter', patterns: ['twitter.com', 'x.com'] },
  { key: 'threads', patterns: ['threads.net'] },
  { key: 'reddit', patterns: ['reddit.com'] }
]

function detectPlatform(url) {
  const lower = (url || '').toLowerCase()
  for (const p of PLATFORM_DETECT) {
    if (p.patterns.some((pat) => lower.includes(pat))) return p.key
  }
  return null
}

async function handleInstagram(url) {
  const result = await instagramDownloader(url)
  return { platform: 'instagram', title: result.title, media: result.media }
}

async function handleYoutube(url) {
  const yt = new Youtube()
  const v = await yt.download(url, 'mp4')
  const a = await yt.download(url, 'mp3')
  const media = []
  if (v.results.download) media.push({ type: 'video', url: v.results.download })
  if (a.results.download) media.push({ type: 'audio', url: a.results.download })
  return { platform: 'youtube', title: v.results.title, media }
}

async function handleTiktok(url) {
  const domain = 'https://www.tikwm.com/api/'
  const res = (await axios.post(domain, {}, { params: { url, hd: 1 } })).data.data
  const media = []
  if (res?.duration === 0) {
    (res.images || []).forEach((v) => media.push({ type: 'image', url: v }))
  } else {
    if (res?.hdplay) media.push({ type: 'video', url: 'https://www.tikwm.com' + res.hdplay })
    if (res?.play) media.push({ type: 'video', url: 'https://www.tikwm.com' + res.play })
  }
  return { platform: 'tiktok', title: res?.title || 'TikTok', media }
}

async function handlePinterest(url) {
  const result = await scrapePinterest(url)
  if (!result?.media?.length) throw new Error('No media found')
  return { platform: 'pinterest', title: result.title, media: result.media }
}

// Menggunakan Regex sebagai pengganti 'cheerio' agar bebas error library
async function handleSavefbs(url) {
  const BASE_URL = 'https://savefbs.com/api/v1/aio'
  const SAVEFBS_HEADERS = {
    accept: '*/*', 'content-type': 'application/json',
    referer: 'https://savefbs.com/all-in-one-video-downloader/',
    'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36'
  }

  const infoRes = await axios.post(`${BASE_URL}/html`, { vid: url, prefix: 'savefbs.com' }, { headers: SAVEFBS_HEADERS, timeout: T_API })
  const html = typeof infoRes.data === 'string' ? infoRes.data : JSON.stringify(infoRes.data)

  const titleMatch = html.match(/<h3[^>]*class="[^"]*text-sm[^"]*"[^>]*>(.*?)<\/h3>/i)
  const title = titleMatch ? titleMatch[1].trim() : 'Downloaded'

  const tokenMatch = html.match(/data-loader-id="([^"]+)"/i)
  if (!tokenMatch) throw new Error('Savefbs token not found')
  const token = tokenMatch[1]

  const formats = []
  const formatRegex = /onclick="[^']*'([^']+)'[^']*"/ig
  let match
  while ((match = formatRegex.exec(html)) !== null) formats.push(match[1])

  if (!formats.length) throw new Error('Savefbs formats not found')

  const VIDEO_PRIORITY = ['1080', '720', '480', '360']
  const AUDIO_FORMATS = ['mp3', 'wav']
  const format = VIDEO_PRIORITY.find((f) => formats.includes(f)) || formats.find((f) => !AUDIO_FORMATS.includes(f)) || formats[0]

  const dlRes = await axios.post(`${BASE_URL}/download`, { token, format }, { headers: SAVEFBS_HEADERS, timeout: T_API })
  const downloadUrl = dlRes.data?.url || dlRes.data?.download || dlRes.data?.data?.url
  if (!downloadUrl) throw new Error('Savefbs no download URL')

  const isAudio = AUDIO_FORMATS.includes(format)
  return {
    platform: 'savefbs',
    title,
    media: [{ type: isAudio ? 'audio' : 'video', url: downloadUrl }]
  }
}

const PLATFORM_HANDLERS = {
  instagram: handleInstagram,
  youtube: handleYoutube,
  tiktok: handleTiktok,
  pinterest: handlePinterest,
  facebook: handleSavefbs,
  capcut: handleSavefbs,
  twitter: handleSavefbs,
  threads: handleSavefbs,
  reddit: handleSavefbs
}

async function aiodl(url) {
  const platform = detectPlatform(url)
  if (!platform) throw new Error('Platform tidak dikenali')

  const handler = PLATFORM_HANDLERS[platform]
  if (!handler) throw new Error(`Handler untuk ${platform} tidak tersedia`)

  try {
    return await handler(url)
  } catch (err) {
    if (platform !== 'twitter' && platform !== 'threads' && platform !== 'reddit' && platform !== 'facebook' && platform !== 'capcut') {
      try { return await handleSavefbs(url) } catch {}
    }
    throw err
  }
}

export {
  ytdl,
  Youtube,
  fallbackToMp3Buffer,
  instagramDownloader,
  scrapePinterest,
  aiodl,
  detectPlatform,
  handleSavefbs
}