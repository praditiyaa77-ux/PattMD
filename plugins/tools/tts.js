import googleTTS from 'google-tts-api'

export default {
    command: ['tts'],
    category: 'tools',
    execute: async (denn, m, { prefix, text }) => {
        if (!text) return m.reply(`Contoh: ${prefix}tts halo apa kabar`)
        await m.reply(global.msg.wait)
        try {
          const url = googleTTS.getAudioUrl(text, {
            lang: 'id',
            slow: false,
            host: 'https://translate.google.com',
          })
          await denn.sendMessage(m.chat, { audio: { url }, mimetype: 'audio/mp4', ptt: true }, { quoted: m })
        } catch (e) { m.reply(`❌ Gagal TTS: ${e.message}`) }
    }
};