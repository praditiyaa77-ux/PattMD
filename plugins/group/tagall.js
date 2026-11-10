export default {
    command: ['tagall', 'hidetag'],
    category: 'group',
    execute: async (denn, m, { command, text, isOwner, checkAdmin }) => {
        if (!m.isGroup) return m.reply(global.msg.group)
        const { isAdmin } = await checkAdmin()
        if (!isAdmin && !isOwner) return m.reply(global.msg.admin)
        
        const metadata = await denn.groupMetadata(m.chat)
        const participants = metadata.participants.map(p => p.id)
        let txt = text ? text : 'Pengumuman!'
        if (command === 'tagall') {
           txt += '\n\n'
           participants.forEach(p => { txt += `@${p.split('@')[0]}\n` })
        }
        await denn.sendMessage(m.chat, { text: txt.trim(), mentions: participants }, { quoted: m })
    }
};