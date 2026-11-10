export default {
    command: ['linkgc'],
    category: 'group',
    execute: async (denn, m, { isOwner, checkAdmin }) => {
        if (!m.isGroup) return m.reply(global.msg.group)
        const { isAdmin, isBotAdmin } = await checkAdmin()
        if (!isAdmin && !isOwner) return m.reply(global.msg.admin)
        if (!isBotAdmin) return m.reply(global.msg.botadmin)
        try {
          const code = await denn.groupInviteCode(m.chat)
          m.reply(`🔗 *Link Group:*\nhttps://chat.whatsapp.com/${code}`)
        } catch (e) { m.reply(`❌ Gagal ambil link: ${e.message}`) }
    }
};