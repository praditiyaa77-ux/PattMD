import { getAllUsers } from '../../lib/rpg.js';

export default {
    command: ['top', 'leaderboard'],
    category: 'rpg',
    execute: async (denn, m) => {
        const allUsers = getAllUsers();
        
        const sortedUsers = Object.entries(allUsers)
            .map(([jid, data]) => {
                return { jid, ...data, totalMoney: (data.money || 0) + (data.bank || 0) };
            })
            .sort((a, b) => b.totalMoney - a.totalMoney)
            .slice(0, 10);

        if (sortedUsers.length === 0) return m.reply('Belum ada user yang bermain RPG.');

        let txt = `🏆 *TOP 10 GLOBAL (TERKAYA)* 🏆\n\n`;
        
        sortedUsers.forEach((user, index) => {
            let medal = `${index + 1}.`;
            if (index === 0) medal = '🥇';
            if (index === 1) medal = '🥈';
            if (index === 2) medal = '🥉';

            const name = user.name || user.jid.split('@')[0];
            
            txt += `${medal} *${name}*\n`;
            txt += `└ 💰 Total: $${user.totalMoney.toLocaleString('id-ID')} (Lv.${user.level || 1})\n\n`;
        });

        await m.reply(txt);
    }
};