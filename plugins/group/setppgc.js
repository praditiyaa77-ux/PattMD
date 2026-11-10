export default {
  command: ['setppgc', 'setppgrup'],
  category: 'group',
  execute: async (denn, m, { isOwner, checkAdmin, mime, qmsg }) => {
    if (!m.isGroup) return m.reply(global.msg.group);
    const { isAdmin, isBotAdmin } = await checkAdmin();
    if (!isAdmin && !isOwner) return m.reply(global.msg.admin);
    if (!isBotAdmin) return m.reply(global.msg.botadmin);
    if (!/image/.test(mime)) return m.reply('Reply gambar dengan caption .setppgc');
    try {
      const { getBuffer } = await import('../../lib/helper.js');
      const media = await getBuffer(qmsg, 'image');
      await denn.updateProfilePicture(m.chat, media);
      await m.reply('✅ Foto profil grup berhasil diubah');
    } catch (e) {
      await m.reply('❌ Gagal: ' + e.message);
    }
  }
};
