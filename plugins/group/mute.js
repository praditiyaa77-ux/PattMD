export default {
  command: ['mute'],
  category: 'group',
  execute: async (denn, m, { text, isOwner, checkAdmin, prefix }) => {
    if (!m.isGroup) return m.reply(global.msg.group);
    const { isAdmin } = await checkAdmin();
    if (!isAdmin && !isOwner) return m.reply(global.msg.admin);
    if (!global.db.chats) global.db.chats = {};
    if (!global.db.chats[m.chat]) global.db.chats[m.chat] = {};
    if (text === 'on') {
      global.db.chats[m.chat].mute = true;
      await m.reply('🔇 Grup di-mute (bot tidak respon non-admin)');
    } else if (text === 'off') {
      global.db.chats[m.chat].mute = false;
      await m.reply('🔊 Grup unmute');
    } else await m.reply(`${prefix}mute on / off`);
  }
};
