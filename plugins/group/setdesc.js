export default {
    command: ['setdesc'],
    category: 'group',
    execute: async (denn, m, { prefix, command, text, isOwner, checkAdmin }) => {
        if (!m.isGroup) return m.reply(global.msg.group)
        const { isAdmin, isBotAdmin } = await checkAdmin()
        if (!isAdmin && !isOwner) return m.reply(global.msg.admin)
        if (!isBotAdmin) return m.reply(global.msg.botadmin)
        if (!text) return m.reply(`Contoh: ${prefix + command} Deskripsi Baru`)
        try {
          await denn.groupUpdateDescription(m.chat, text)
          m.reply(`✅ Deskripsi grup berhasil diubah.`)
        } catch (e) { m.reply(`❌ Gagal ganti deskripsi: ${e.message}`) }
    }
};