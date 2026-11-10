export default {
  command: ['antilink'],
  category: 'group',
  execute: async (denn, m, { text, isOwner, checkAdmin, prefix }) => {
    if (!m.isGroup) return m.reply(global.msg.group);
    const { isAdmin } = await checkAdmin();
    if (!isAdmin && !isOwner) return m.reply(global.msg.admin);
    if (!global.db.chats) global.db.chats = {};
    if (!global.db.chats[m.chat]) global.db.chats[m.chat] = {};
    const on = text === 'on';
    const off = text === 'off';
    if (!on && !off) return m.reply(`Contoh: ${prefix}antilink on / off`);
    global.db.chats[m.chat].antilink = on;
    await m.reply(`✅ Antilink ${on ? 'diaktifkan' : 'dimatikan'} untuk grup ini`);
  }
};
