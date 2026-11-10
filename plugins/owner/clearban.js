export default {
  command: ['clearban'],
  category: 'owner',
  execute: async (denn, m, { isOwner }) => {
    if (!isOwner) return m.reply(global.msg.owner);
    global.db.banned = [];
    await m.reply('✅ Semua ban dibersihkan');
  }
};
