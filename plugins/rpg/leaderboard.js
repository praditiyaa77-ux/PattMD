export default {
  command: ['leaderboard','lb','rank'],
  category: 'rpg',
  execute: async (denn, m) => {
    const { getAllUsers, formatMoney } = await import('../../lib/rpg.js');
    const users = Object.entries(getAllUsers())
      .map(([jid, u]) => ({ jid, money: u.money||0, level: u.level||1 }))
      .sort((a,b) => b.money - a.money)
      .slice(0, 10);
    let out = '🏆 *LEADERBOARD MONEY*\n\n';
    users.forEach((u,i) => {
      out += `${i+1}. ${u.jid.split('@')[0]} - ${formatMoney(u.money)} (Lv.${u.level})\n`;
    });
    await m.reply(out || 'Belum ada data');
  }
};
