export default {
    command: ['autoreadsw'],
    category: 'owner',
    execute: async (denn, m, { prefix, command, text, isOwner }) => {
        if (!isOwner) return m.reply(global.msg.owner)
        if (!text) return m.reply(`Format: ${prefix + command} on/off`)
        global.autoreadsw = text.toLowerCase() === 'on'
        m.reply(`✅ Auto-Read Status berhasil di *${global.autoreadsw ? 'ON' : 'OFF'}* kan.`)
    }
};