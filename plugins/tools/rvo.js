import { getBuffer } from '../../lib/helper.js'

export default {
    command: ['rvo', 'readviewonce'],
    category: 'tools',
    execute: async (denn, m, { prefix, command }) => {
        if (!m.quoted) return m.reply(`Reply pesan view once (sekali lihat) dengan caption *${prefix + command}*`)
        
        let msg = m.quoted.message
        let type = Object.keys(msg)[0]
        
        if (type === 'viewOnceMessage' || type === 'viewOnceMessageV2') {
          msg = msg[type].message
          type = Object.keys(msg)[0]
        }
        
        if (!/image|video|audio/.test(type)) return m.reply('❌ Media tidak didukung atau bukan View Once!')
        
        try {
          const buffer = await getBuffer(msg[type], type.replace('Message', '').toLowerCase())
          if (type === 'imageMessage') {
            await denn.sendMessage(m.chat, { image: buffer, caption: msg[type].caption || '' }, { quoted: m })
          } else if (type === 'videoMessage') {
            await denn.sendMessage(m.chat, { video: buffer, caption: msg[type].caption || '' }, { quoted: m })
          } else if (type === 'audioMessage') {
            await denn.sendMessage(m.chat, { audio: buffer, mimetype: 'audio/mp4', ptt: true }, { quoted: m })
          }
        } catch (e) { m.reply(`❌ Gagal ambil media: ${e.message}`) }
    }
};