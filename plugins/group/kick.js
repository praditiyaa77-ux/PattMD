export default {
    command: ['kick'],
    category: 'group',
    execute: async (denn, m, { isOwner, getTarget, checkAdmin }) => {
        if (!m.isGroup) return m.reply(global.msg.group)
        const { isAdmin, isBotAdmin } = await checkAdmin()
        if (!isAdmin && !isOwner) return m.reply(global.msg.admin)
        if (!isBotAdmin) return m.reply(global.msg.botadmin)
        
        const target = getTarget()
        if (!target) return m.reply(`Tag/reply target atau masukkan nomor`)
        try {
          await denn.groupParticipantsUpdate(m.chat, [target], 'remove')
          m.reply(`✅ Berhasil mengeluarkan @${target.split('@')[0]}`, { mentions: [target] })
        } catch (e) { m.reply(`❌ Gagal kick: ${e.message}`) }
    }
};