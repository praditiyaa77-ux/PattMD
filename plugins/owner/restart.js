export default {
    command: ['restart'],
    category: 'owner',
    execute: async (denn, m, { isOwner }) => {
        if (!isOwner) return m.reply(global.msg.owner)
        await m.reply('🔄 Merestart bot...')
        process.exit(0)
    }
};