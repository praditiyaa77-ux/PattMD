export default {
    command: ['img', 'aiimg'],
    category: 'tools',
    execute: async (denn, m, { prefix, text }) => {
        if (!text) return m.reply(`Contoh: ${prefix}img kucing pakai jas hujan`)
        await m.reply(global.msg.wait)
        try {
          const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(text)}?width=1024&height=1024&nologo=true`
          await denn.sendMessage(m.chat, { 
            image: { url }, 
            caption: `🎨 *AI Image Generator*\n\n📝 *Prompt:* ${text}` 
          }, { quoted: m })
        } catch (e) { 
          m.reply(`❌ Gagal membuat gambar: ${e.message}`) 
        }
    }
};