import fs from 'fs'
import { ImageUploadService } from 'node-upload-images'
import { getBuffer } from '../../lib/helper.js'

export default {
    command: ['setthumbnail', 'setthumb'],
    category: 'owner',
    execute: async (denn, m, { prefix, command, text, isOwner, mime, qmsg }) => {
        if (!isOwner) return m.reply(global.msg.owner)
        let url = text
        if (m.quoted && /image/.test(mime)) {
          await m.reply(global.msg.wait)
          try {
            const buffer = await getBuffer(qmsg, 'image')
            const service = new ImageUploadService('pixhost.to')
            const { directLink } = await service.uploadFromBinary(buffer, `thumb_${Date.now()}.jpg`)
            url = directLink
          } catch (e) { return m.reply(`❌ Gagal upload gambar: ${e.message}`) }
        }
        
        if (!url) return m.reply(`Kirim/reply gambar atau masukkan link gambar!\nContoh: ${prefix + command} https://link.com/gambar.jpg`)
        
        global.thumbnail = url
        try {
          let settings = fs.readFileSync('./settings.js', 'utf-8')
          settings = settings.replace(/global\.thumbnail\s*=\s*["'].*?["']/g, `global.thumbnail = "${url}"`)
          fs.writeFileSync('./settings.js', settings)
        } catch (e) {}
        
        m.reply(`✅ Thumbnail menu berhasil diubah!`)
    }
};