export default {
  command: ['leave'],
  category: 'owner',
  execute: async (denn, m, { text, isOwner }) => {
    
    if (!isOwner) return m.reply(global.msg.owner);
    if (!m.isGroup) return m.reply('Hanya di grup');
    await m.reply('👋 Bye');
    await denn.groupLeave(m.chat);
  
  }
};