import fs from 'fs'
import ffmpeg from 'fluent-ffmpeg'
import { getBuffer } from '../../lib/helper.js'

export default {
    command: ['tovid', 'tovideo'],
    category: 'tools',
    execute: async (denn, m, { prefix, command, mime, qmsg }) => {
        if (!/webp/.test(mime)) return m.reply(`Reply stiker bergerak dengan caption *${prefix + command}*`)
        await m.reply(global.msg.wait)
        let tmpFile = `./tmp_${Date.now()}.webp`
        let outFile = `./tmp_${Date.now()}.mp4`
        try {
          const buffer = await getBuffer(qmsg, 'sticker')
          fs.writeFileSync(tmpFile, buffer)
          await new Promise((resolve, reject) => {
            ffmpeg(tmpFile)
              .on('end', resolve)
              .on('error', reject)
              .addOutputOptions(['-pix_fmt yuv420p', '-vf scale=trunc(iw/2)*2:trunc(ih/2)*2'])
              .toFormat('mp4')
              .save(outFile)
          })
          await denn.sendMessage(m.chat, { video: fs.readFileSync(outFile), mimetype: 'video/mp4' }, { quoted: m })
        } catch (e) {
          m.reply(`❌ Gagal convert: ${e.message}`)
        } finally {
          if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile)
          if (fs.existsSync(outFile)) fs.unlinkSync(outFile)
        }
    }
};