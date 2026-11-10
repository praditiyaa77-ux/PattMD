export default {
  command: ['block'],
  category: 'owner',
  execute: async (denn, m, { text, isOwner, getTarget }) => {
    if (!isOwner) return m.reply(global.msg.owner);
    const target = getTarget();
    if (!target) return m.reply('Tag atau ketik nomor yang mau di-block');
    try {
      await denn.updateBlockStatus(target, 'block');
      await m.reply(`✅ Berhasil block @${target.split('@')[0]}`);
    } catch (e) {
      await m.reply('❌ Gagal: ' + e.message);
    }
  }
};
