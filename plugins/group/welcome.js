export default {
  command: ['welcome'],
  category: 'group',
  execute: async (denn, m, { text, isOwner, checkAdmin, prefix }) => {
    if (!m.isGroup) return m.reply(global.msg.group);
    const { isAdmin } = await checkAdmin();
    if (!isAdmin && !isOwner) return m.reply(global.msg.admin);
    if (!global.db.chats) global.db.chats = {};
    if (!global.db.chats[m.chat]) global.db.chats[m.chat] = {};
    if (text === 'on') {
      global.db.chats[m.chat].welcome = true;
      await m.reply('✅ Welcome message diaktifkan');
    } else if (text === 'off') {
      global.db.chats[m.chat].welcome = false;
      await m.reply('✅ Welcome message dimatikan');
    } else {
      await m.reply(`Contoh: ${prefix}welcome on / off`);
    }
  }
};
