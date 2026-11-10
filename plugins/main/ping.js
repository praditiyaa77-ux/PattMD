import { clockString } from '../../lib/helper.js';

export default {
    command: ['ping'],
    category: 'main',
    execute: async (denn, m) => {
        const t1 = Date.now()
        await m.reply('Pong!')
        await m.reply(`⚡ *${Date.now() - t1}ms*\n⏱️ *Uptime:* ${clockString(process.uptime() * 1000)}`)
    }
};