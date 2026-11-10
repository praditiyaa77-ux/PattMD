import fs from 'fs'
import path from 'path'
import { getBuffer } from '../../lib/helper.js'

export default {
    command: ['sf', 'savefile'],
    category: 'owner',
    execute: async (denn, m, { prefix, command, text, isOwner }) => {
        if (!isOwner) return m.reply(global.msg.owner)
        if (!text) return m.reply(`Format: ${prefix + command} <path/nama_file.js>`)
        if (!m.quoted) return m.reply(`Reply pesan berisi kode!`)

        let code = ''
        if (m.quoted.mtype === 'documentMessage') {
            const buffer = await getBuffer(m.quoted.msg, 'document')
            code = buffer.toString('utf-8')
        } else {
            code = m.quoted.text || m.quoted.msg?.text || m.quoted.msg?.conversation || ''
        }

        if (!code) return m.reply(`Tidak ada kode!`)
        code = code.replace(/^```(?:javascript|js)?\n/gm, '').replace(/\n```$/gm, '').trim()

        let cleanPath = text.replace(/^\.\//, '').replace(/^\//, '').replace(/\\/g, '/')
        if (!cleanPath.endsWith('.js')) cleanPath += '.js'

        const rootDir = process.cwd()
        const knownRoots = ['plugins/', 'lib/', 'cmd/', 'source/', 'session/']
        const isKnownRoot = knownRoots.some(r => cleanPath.startsWith(r))
        const isRootFile = !cleanPath.includes('/') && fs.existsSync(path.join(rootDir, cleanPath))
        
        if (!isKnownRoot && !isRootFile) cleanPath = 'plugins/' + cleanPath

        const targetPath = path.join(rootDir, cleanPath)
        if (!targetPath.startsWith(rootDir)) return m.reply(`Path tidak valid!`)

        try {
            const dir = path.dirname(targetPath)
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
            fs.writeFileSync(targetPath, code, 'utf-8')
            m.reply(`Berhasil menyimpan ke: ${cleanPath}\n\nKetik ${prefix}reload`)
        } catch (e) {
            m.reply(`Gagal menyimpan file: ${e.message}`)
        }
    }
}