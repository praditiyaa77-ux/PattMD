export default {
  command: ['afk'],
  category: 'main',
  execute: async (denn, m, { text }) => {
    if (!global.db.users) global.db.users = {};
    if (!global.db.users[m.sender]) global.db.users[m.sender] = {};
    global.db.users[m.sender].afk = { time: Date.now(), reason: text || 'AFK' };
    await m.reply(`💤 *AFK*\n\nKamu sekarang AFK.\nAlasan: ${text || 'Tidak ada'}`);
  }
};
