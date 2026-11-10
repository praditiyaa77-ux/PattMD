export default {
    command: ['listban'],
    category: 'owner',
    execute: async (denn, m, { isOwner }) => {
        if (!isOwner) return m.reply(global.msg.owner)
        if (global.db.banned.length === 0) return m.reply('List ban kosong.')
        let txt = `📋 *LIST BAN (${global.db.banned.length})*\n\n`
        global.db.banned.forEach((v, i) => { txt += `${i + 1}. @${v.split('@')[0]}\n` })
        m.reply(txt.trim(), { mentions: global.db.banned })
    }
};