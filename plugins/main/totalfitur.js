export default {
    command: ['totalfitur', 'totalfeature'],
    category: 'main',
    execute: async (denn, m) => {
        const fiturCount = global.plugins ? global.plugins.size : 0
        await m.reply(`📊 *Total Fitur Tersedia:* ${fiturCount} fitur`)
    }
};