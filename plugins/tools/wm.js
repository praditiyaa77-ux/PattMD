import axios from 'axios'
import FormData from 'form-data'
import { getBuffer } from '../../lib/helper.js'

export default {
    command: ['wm', 'stikerwm'],
    category: 'tools',
    execute: async (denn, m, { prefix, command, text, mime, qmsg }) => {
        if (!text) return m.reply(`Format: *${prefix + command} pack|author*`)
        if (!/image/.test(mime)) return m.reply(`Kirim/reply gambar dengan caption *${prefix + command} pack|author*`)
        await m.reply(global.msg.wait)
        try {
          const [pack, author] = text.split('|').map(v => v?.trim())
          const buffer = await getBuffer(qmsg, 'image')
          
          const form = new FormData()
          form.append('image', buffer, { filename: 'image.jpg' })
          form.append('packname', pack || global.namabot)
          form.append('author', author || global.namaowner)
          
          const res = await axios.post('https://api.evla.xyz/tools/sticker', form, {
            headers: form.getHeaders(),
            responseType: 'arraybuffer'
          })
          await denn.sendMessage(m.chat, { sticker: Buffer.from(res.data) }, { quoted: m })
        } catch (e) { 
          m.reply(`❌ Gagal membuat stiker WM: ${e.message}`) 
        }
    }
};