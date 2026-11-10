export default {
    command: ['autoreactsw'],
    category: 'owner',
    execute: async (denn, m, { prefix, command, text, isOwner }) => {
        if (!isOwner) return m.reply(global.msg.owner)
        if (!text) return m.reply(`Format: ${prefix + command} on/off`)
        global.autolikesw = text.toLowerCase() === 'on'
        m.reply(`✅ Auto-Like Status berhasil di *${global.autolikesw ? 'ON' : 'OFF'}* kan.`)
    }
};