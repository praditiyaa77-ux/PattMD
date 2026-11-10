import fs from 'fs'
import path from 'path'

export default {
    command: ['getplugins', 'gp'],
    category: 'owner',
    execute: async (denn, m, { prefix, command, text, isOwner }) => {
        if (!isOwner) return m.reply(global.msg.owner)
        if (!text) return m.reply(`Format: ${prefix + command} <nama_file>\nContoh: ${prefix + command} ping.js`)

        const pluginsDir = path.join(process.cwd(), 'plugins')
        
        // Pencarian file secara rekursif
        const findFile = (dir, filename) => {
            const files = fs.readdirSync(dir, { withFileTypes: true });
            for (const file of files) {
                const fullPath = path.join(dir, file.name);
                if (file.isDirectory()) {
                    const found = findFile(fullPath, filename);
                    if (found) return found;
                } else if (file.name === filename) {
                    return fullPath;
                }
            }
            return null;
        };

        let cleanPath = text.replace(/^\.\//, '').replace(/^\//, '').replace(/\\/g, '/')
        if (cleanPath.startsWith('plugins/')) cleanPath = cleanPath.replace('plugins/', '')
        if (!cleanPath.endsWith('.js')) cleanPath += '.js'

        let filePath = path.join(pluginsDir, cleanPath);
        
        if (!fs.existsSync(filePath)) {
            filePath = findFile(pluginsDir, path.basename(cleanPath));
        }

        if (!filePath) return m.reply(`❌ File plugin *${cleanPath}* tidak ditemukan!`);

        try {
            const code = fs.readFileSync(filePath, 'utf-8');
            const fileName = path.basename(filePath);
            
            if (code.length > 4000) {
                await denn.sendMessage(m.chat, { 
                    document: Buffer.from(code, 'utf-8'), 
                    mimetype: 'application/javascript', 
                    fileName: fileName,
                    caption: `📄 *File Plugin:* ${fileName}\n\n_Kode terlalu panjang, dikirim sebagai file. Reply file ini dan ketik .sf path/tujuan.js_`
                }, { quoted: m });
            } else {
                const txt = `📄 *Preview Plugin:* ${fileName}\n\n\`\`\`javascript\n${code}\n\`\`\``;
                await m.reply(txt);
            }
            
        } catch (e) {
            m.reply(`❌ Gagal membaca file: ${e.message}`);
        }
    }
};