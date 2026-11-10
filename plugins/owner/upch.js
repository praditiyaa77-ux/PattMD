import { getBuffer } from '../../lib/helper.js'

export default {
    command: ['upch'],
    category: 'owner',
    execute: async (denn, m, { text, isOwner }) => {
        if (!isOwner) return m.reply(global.msg.owner)
        const channelId = global.idch
        if (!channelId || !channelId.endsWith('@newsletter')) return m.reply(`❌ ID Channel belum diset atau tidak valid di settings.js (global.idch)`)
        
        let content = {}
        const type = m.quoted ? m.quoted.mtype : m.mtype
        
        try {
          await m.reply(global.msg.wait)
          if (type === 'conversation' || type === 'extendedTextMessage') {
            const txt = m.quoted ? m.quoted.text : text
            if (!txt) return m.reply('Kirim teks atau reply pesan teks!')
            content = { text: txt }
          } else if (type === 'imageMessage') {
            const buffer = await getBuffer(m.quoted ? m.quoted.msg : m.msg, 'image')
            content = { image: buffer, caption: m.quoted ? m.quoted.text : text }
          } else if (type === 'videoMessage') {
            const buffer = await getBuffer(m.quoted ? m.quoted.msg : m.msg, 'video')
            content = { video: buffer, caption: m.quoted ? m.quoted.text : text }
          } else {
            return m.reply('Tipe media belum didukung (Hanya Teks, Gambar, Video).')
          }
          
          await denn.sendMessage(channelId, content)
          m.reply(`✅ Berhasil di-upload ke Channel!`)
        } catch (e) {
          m.reply(`❌ Gagal upload ke channel: ${e.message}`)
        }
    }
};