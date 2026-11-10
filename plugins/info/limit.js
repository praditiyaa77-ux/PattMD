export default {
  command: ['limit','ceklimit'],
  category: 'info',
  execute: async (denn, m) => {
    try {
      const { getUser } = await import('../../lib/rpg.js');
      const user = getUser(m.sender);
      await m.reply(`🎫 Limit kamu: *${user.limit || 0}*`);
    } catch {
      await m.reply('Limit: unlimited (free)');
    }
  }
};
