export default {
  command: ['getdb'],
  category: 'owner',
  execute: async (denn, m, { isOwner }) => {
    if (!isOwner) return m.reply(global.msg.owner);
    await m.reply(`Database status:\nBanned: ${(global.db?.banned||[]).length}\nPublic: ${global.db?.public}\nChats: ${Object.keys(global.db?.chats||{}).length}`);
  }
};
