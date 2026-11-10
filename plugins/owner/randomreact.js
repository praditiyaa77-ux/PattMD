export default {
    command: ['randomreact'],
    category: 'owner',
    execute: async (denn, m, { prefix, command, text, isOwner }) => {
        if (!isOwner) return m.reply(global.msg.owner)
        if (!text) return m.reply(`Format: ${prefix + command} on/off`)
        global.randomreact = text.toLowerCase() === 'on'
        m.reply(`✅ Random-React berhasil di *${global.randomreact ? 'ON' : 'OFF'}* kan.`)
    }
};