import axios from 'axios'

export default {
    command: ['brat'],
    category: 'fun',
    execute: async (denn, m, { prefix, text }) => {
        if (!text) return m.reply(`Contoh: ${prefix}brat Halo Kamu`)
        await m.reply(global.msg.wait)
        
        try {
            const url = `https://api.siputzx.my.id/api/m/brat?text=${encodeURIComponent(text)}`
            
            // Mengirim gambar sebagai stiker
            await denn.sendMessage(m.chat, { 
                sticker: { url: url } 
            }, { quoted: m })
            
        } catch (e) { 
            m.reply(`❌ Gagal membuat stiker Brat. Server API sedang sibuk.`) 
        }
    }
};