export default {
  command: ['revoke', 'resetlink'],
  category: 'group',
  execute: async (denn, m, { isOwner, checkAdmin }) => {
    if (!m.isGroup) return m.reply(global.msg.group);
    const { isAdmin, isBotAdmin } = await checkAdmin();
    if (!isAdmin && !isOwner) return m.reply(global.msg.admin);
    if (!isBotAdmin) return m.reply(global.msg.botadmin);
    try {
      const code = await denn.groupRevokeInvite(m.chat);
      await m.reply(`✅ Link grup berhasil direset.\nLink baru: https://chat.whatsapp.com/${code}`);
    } catch (e) {
      await m.reply('❌ Gagal reset link: ' + e.message);
    }
  }
};
