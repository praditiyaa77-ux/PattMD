import { fetchTermai } from '../../lib/helper.js'

export default {
    command: ['ytmp4'],
    category: 'downloader',
    execute: async (denn, m, { prefix, text }) => {
        if (!text) return m.reply(`Contoh: ${prefix}ytmp4 https://youtu.be/xxx`)
        await m.reply(global.msg.wait)
        try {
          const data = await fetchTermai('/downloader/youtube', { url: text, format: 'mp4' })
          const videoUrl = data.url || data.download_url || data.link
          if (!videoUrl) throw new Error("Link video tidak ditemukan")
          await denn.sendMessage(m.chat, { video: { url: videoUrl }, mimetype: 'video/mp4' }, { quoted: m })
          await m.reply(`✅ Berhasil diunduh.`)
        } catch (e) { m.reply(`❌ Gagal YTMP4: ${e.message}`) }
    }
};