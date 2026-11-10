export default {
    command: ['add'],
    category: 'group',
    execute: async (denn, m, { prefix, command, text, isOwner, checkAdmin }) => {
        if (!m.isGroup) return m.reply(global.msg.group)
        const { isAdmin, isBotAdmin } = await checkAdmin()
        if (!isAdmin && !isOwner) return m.reply(global.msg.admin)
        if (!isBotAdmin) return m.reply(global.msg.botadmin)
        if (!text) return m.reply(`Contoh: ${prefix + command} 628xxx`)
        
        const target = text.replace(/[^0-9]/g, "") + "@s.whatsapp.net"
        try {
          await denn.groupParticipantsUpdate(m.chat, [target], 'add')
          m.reply(`✅ Berhasil menambahkan @${target.split('@')[0]}`, { mentions: [target] })
        } catch (e) { m.reply(`❌ Gagal add: ${e.message}`) }
    }
};