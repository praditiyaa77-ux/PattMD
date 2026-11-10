export default {
    command: ['ban'],
    category: 'owner',
    execute: async (denn, m, { isOwner, getTarget }) => {
        if (!isOwner) return m.reply(global.msg.owner)
        const target = getTarget()
        if (!target) return m.reply(`Tag/reply target atau masukkan nomor`)
        if (global.db.banned.includes(target)) return m.reply('User sudah di-ban!')
        global.db.banned.push(target)
        m.reply(`🚫 Berhasil mem-ban @${target.split('@')[0]}`, { mentions: [target] })
    }
};