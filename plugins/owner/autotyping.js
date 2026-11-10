export default {
    command: ['autotyping'],
    category: 'owner',
    execute: async (denn, m, { prefix, command, text, isOwner }) => {
        if (!isOwner) return m.reply(global.msg.owner)
        if (!text) return m.reply(`Format: ${prefix + command} on/off`)
        global.autotyping = text.toLowerCase() === 'on'
        m.reply(`✅ Auto-Typing berhasil di *${global.autotyping ? 'ON' : 'OFF'}* kan.`)
    }
};