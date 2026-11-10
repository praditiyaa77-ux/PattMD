export default {
  command: ['unblock'],
  category: 'owner',
  execute: async (denn, m, { text, isOwner, getTarget }) => {
    if (!isOwner) return m.reply(global.msg.owner);
    const target = getTarget();
    if (!target) return m.reply('Tag atau ketik nomor yang mau di-unblock');
    try {
      await denn.updateBlockStatus(target, 'unblock');
      await m.reply(`✅ Berhasil unblock @${target.split('@')[0]}`);
    } catch (e) {
      await m.reply('❌ Gagal: ' + e.message);
    }
  }
};
