export default {
    command: ['public', 'self'],
    category: 'owner',
    execute: async (denn, m, { command, isOwner }) => {
        if (!isOwner) return m.reply(global.msg.owner)
        if (command === 'self') {
            global.db.public = false
            m.reply('✅ Bot diubah ke mode *SELF* (Hanya Owner)')
        } else {
            global.db.public = true
            m.reply('✅ Bot diubah ke mode *PUBLIC* (Semua Orang)')
        }
    }
};