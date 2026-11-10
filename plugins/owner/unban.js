export default {
    command: ['unban'],
    category: 'owner',
    execute: async (denn, m, { isOwner, getTarget }) => {
        if (!isOwner) return m.reply(global.msg.owner)
        const target = getTarget()
        if (!target) return m.reply(`Tag/reply target atau masukkan nomor`)
        if (!global.db.banned.includes(target)) return m.reply('User tidak ada di list ban!')
        global.db.banned = global.db.banned.filter(v => v !== target)
        m.reply(`✅ Berhasil unban @${target.split('@')[0]}`, { mentions: [target] })
    }
};