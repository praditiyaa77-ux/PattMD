export default {
    command: ['setname'],
    category: 'group',
    execute: async (denn, m, { prefix, command, text, isOwner, checkAdmin }) => {
        if (!m.isGroup) return m.reply(global.msg.group)
        const { isAdmin, isBotAdmin } = await checkAdmin()
        if (!isAdmin && !isOwner) return m.reply(global.msg.admin)
        if (!isBotAdmin) return m.reply(global.msg.botadmin)
        if (!text) return m.reply(`Contoh: ${prefix + command} Nama Baru`)
        try {
          await denn.groupUpdateSubject(m.chat, text)
          m.reply(`✅ Nama grup diubah menjadi: *${text}*`)
        } catch (e) { m.reply(`❌ Gagal ganti nama: ${e.message}`) }
    }
};