import { execFile } from 'child_process'
import { promisify } from 'util'
import AdmZip from 'adm-zip'
import fs from 'fs'

const run = promisify(execFile)
const REPO_RE = /^https:\/\/(github\.com|gitlab\.com)\/([\w.-]+)\/([\w.-]+?)(\.git)?\/?$/i

export default {
    command: ['gitclone'],
    category: 'tools',
    execute: async (denn, m, { prefix, text }) => {
        const url = (text || '').trim()
        if (!url) return m.reply(`Contoh: ${prefix}gitclone https://github.com/user/repo`)
        const match = url.match(REPO_RE)
        if (!match) return m.reply('❌ Hanya URL repo GitHub/GitLab (https) yang didukung.')

        await m.reply(global.msg.wait)
        const repoName = match[3].replace(/[^\w.-]/g, '_')
        const folder = `./tmp_${repoName}_${Date.now()}`
        try {
            await run('git', ['clone', '--depth', '1', '--', url, folder], { timeout: 60000 })
            const zip = new AdmZip()
            zip.addLocalFolder(folder)
            const zipBuffer = zip.toBuffer()

            await denn.sendMessage(m.chat, {
                document: zipBuffer,
                mimetype: 'application/zip',
                fileName: `${repoName}.zip`,
                caption: `✅ Berhasil clone repository *${repoName}*`
            }, { quoted: m })
        } catch (e) {
            m.reply(`❌ Gagal clone: ${e.message}`)
        } finally {
            fs.rmSync(folder, { recursive: true, force: true })
        }
    }
};
