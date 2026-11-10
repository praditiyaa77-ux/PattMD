export default {
  command: ['linkgrup','linkgroup'],
  category: 'group',
  execute: async (denn, m, { checkAdmin }) => {
    if (!m.isGroup) return m.reply(global.msg.group);
    const { isBotAdmin } = await checkAdmin();
    if (!isBotAdmin) return m.reply(global.msg.botadmin);
    try {
      const code = await denn.groupInviteCode(m.chat);
      await m.reply(`🔗 https://chat.whatsapp.com/${code}`);
    } catch (e) {
      await m.reply('❌ Gagal ambil link');
    }
  }
};
