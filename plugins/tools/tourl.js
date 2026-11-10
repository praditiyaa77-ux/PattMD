import { ImageUploadService } from 'node-upload-images'
import { getBuffer } from '../../lib/helper.js'

export default {
    command: ['tourl'],
    category: 'tools',
    execute: async (denn, m, { prefix, command, mime, qmsg }) => {
        if (!/image/.test(mime)) return m.reply(`Kirim/reply gambar dengan caption *${prefix + command}*`)
        await m.reply(global.msg.wait)
        try {
          const buffer = await getBuffer(qmsg, 'image')
          const service = new ImageUploadService('pixhost.to')
          const { directLink } = await service.uploadFromBinary(buffer, `denncode.jpg`)
          await m.reply(`🔗 *Link:*\n${directLink}`)
        } catch (e) { m.reply(`❌ Gagal upload: ${e.message}`) }
    }
};