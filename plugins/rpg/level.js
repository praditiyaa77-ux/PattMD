import { getUser, formatMoney } from '../../lib/rpg.js';

export default {
  command: ['level', 'lvl', 'xp'],
  category: 'rpg',
  execute: async (denn, m) => {
    const user = getUser(m.sender);
    const need = (user.level || 1) * 100;
    const percent = Math.min(100, Math.floor(((user.xp || 0) / need) * 100));
    const bar = '█'.repeat(Math.floor(percent / 10)) + '░'.repeat(10 - Math.floor(percent / 10));

    await m.reply(
`⭐ *LEVEL & XP*

Level: *${user.level || 1}*
XP: *${user.xp || 0}/${need}* (${percent}%)
[${bar}]

💵 Dompet: ${formatMoney(user.money)}
🏦 Bank: ${formatMoney(user.bank)}
❤️ HP: ${user.health || 100}/100
🎟️ Limit: ${user.limit || 0}

_Main fitur RPG (berburu, mining, daily, dll) untuk naik XP._`
    );
  }
};
