import axios from 'axios'
import FormData from 'form-data'
import https from 'https'
import crypto from 'crypto'
import { getBuffer } from '../../lib/helper.js'

export default {
    command: ['toimg', 'toimage'],
    category: 'tools',
    execute: async (denn, m, { prefix, command, mime, qmsg }) => {
        if (!/webp/.test(mime)) return m.reply(`Reply stiker dengan caption *${prefix + command}*`)
        await m.reply(global.msg.wait)
        
        try {
            const buffer = await getBuffer(qmsg, 'sticker')
            

            const form = new FormData()
            form.append('file', buffer, { filename: 'sticker.webp' })

            const httpsAgent = new https.Agent({
                rejectUnauthorized: false,
                secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT
            })


            const res = await axios.post('https://pixltools.com/api/convert', form, {
                headers: {
                    ...form.getHeaders(),
                    'Accept': 'image/png'
                },
                responseType: 'arraybuffer',
                httpsAgent: httpsAgent,
                timeout: 15000
            })

            //Kirim hasil gambar
            await denn.sendMessage(m.chat, { image: Buffer.from(res.data) }, { quoted: m })
        } catch (e) { 
            m.reply(`❌ Gagal convert ke gambar: ${e.message}`) 
        }
    }
}