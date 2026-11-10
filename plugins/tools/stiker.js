import fs from 'fs'
import path from 'path'
import ffmpeg from 'fluent-ffmpeg'
import { getBuffer } from '../../lib/helper.js'

export default {
    command: ['stiker', 's'],
    category: 'tools',
    execute: async (denn, m, { prefix, command, mime, qmsg }) => {
        if (!/image|video/.test(mime)) return m.reply(`Kirim/reply gambar atau video dengan caption *${prefix + command}*`)
        
        const isVideo = /video/.test(mime)
        if (isVideo && qmsg.seconds > 10) return m.reply('Durasi video maksimal 10 detik!')
        
        await m.reply(global.msg.wait)
        
        const tmpIn = path.join(process.cwd(), `tmp_in_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`)
        const tmpOut = path.join(process.cwd(), `tmp_out_${Date.now()}.webp`)
        
        try {
            const type = isVideo ? 'video' : 'image'
            const buffer = await getBuffer(qmsg, type)
            fs.writeFileSync(tmpIn, buffer)

            await new Promise((resolve, reject) => {
                let ff = ffmpeg(tmpIn)
                
                if (isVideo) {
                    ff = ff.addOutputOptions([
                        '-vcodec', 'libwebp',
                        '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000',
                        '-loop', '0',
                        '-ss', '00:00:00.0',
                        '-t', '00:00:10.0',
                        '-preset', 'default',
                        '-an', '-vsync', '0',
                        '-s', '512:512'
                    ])
                } else {
                    ff = ff.addOutputOptions([
                        '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000',
                        '-vcodec', 'libwebp',
                        '-lossless', '0',
                        '-qscale', '75',
                        '-preset', 'default',
                        '-an', '-vsync', '0',
                        '-s', '512:512'
                    ])
                }

                ff.toFormat('webp')
                  .on('end', resolve)
                  .on('error', reject)
                  .save(tmpOut)
            })

            const stickerBuffer = fs.readFileSync(tmpOut)
            await denn.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m })

        } catch (e) {
            m.reply(`❌ Gagal membuat stiker: ${e.message}`)
        } finally {
            if (fs.existsSync(tmpIn)) fs.unlinkSync(tmpIn)
            if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut)
        }
    }
}