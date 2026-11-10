import axios from 'axios'

export default {
    command: ['emojimix', 'mix'],
    category: 'tools',
    execute: async (denn, m, { prefix, command, text }) => {
        const emojis = text.match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu)
        if (!emojis || emojis.length < 2) {
          return m.reply(`Contoh: ${prefix + command} 😂 😭\n(Kirim 2 emoji yang dipisah spasi)`)
        }
        await m.reply(global.msg.wait)
        try {
          const e1 = emojis[0]
          const e2 = emojis[1]
          
          let mixUrl = `https://api.evla.xyz/tools/emojimix?emoji1=${encodeURIComponent(e1)}&emoji2=${encodeURIComponent(e2)}`
          
          try {
            const test = await axios.get(mixUrl, { responseType: 'arraybuffer', timeout: 10000 })
            const buffer = Buffer.from(test.data)
            await denn.sendMessage(m.chat, { sticker: buffer }, { quoted: m })
          } catch (apiError) {
            mixUrl = `https://api.siputzx.my.id/api/iloveimg/emojimix?emoji1=${encodeURIComponent(e1)}&emoji2=${encodeURIComponent(e2)}`
            await denn.sendMessage(m.chat, { sticker: { url: mixUrl } }, { quoted: m })
          }
        } catch (e) { 
          m.reply(`❌ Gagal mix emoji. Server API sedang sibuk, coba lagi nanti.`) 
        }
    }
};