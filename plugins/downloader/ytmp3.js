import { fetchTermai } from '../../lib/helper.js'

export default {
    command: ['ytmp3'],
    category: 'downloader',
    execute: async (denn, m, { prefix, text }) => {
        if (!text) return m.reply(`Contoh: ${prefix}ytmp3 https://youtu.be/xxx`)
        await m.reply(global.msg.wait)
        try {
          const data = await fetchTermai('/downloader/youtube', { url: text, format: 'mp3' })
          const audioUrl = data.url || data.download_url || data.link
          if (!audioUrl) throw new Error("Link audio tidak ditemukan")
          await denn.sendMessage(m.chat, { audio: { url: audioUrl }, mimetype: 'audio/mpeg' }, { quoted: m })
          await m.reply(`✅ Berhasil diunduh.`)
        } catch (e) { m.reply(`❌ Gagal YTMP3: ${e.message}`) }
    }
};