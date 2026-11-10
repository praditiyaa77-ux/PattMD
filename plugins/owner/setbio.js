export default {
  command: ['setbio'],
  category: 'owner',
  execute: async (denn, m, { text, isOwner }) => {
    if (!isOwner) return m.reply(global.msg.owner);
    if (!text) return m.reply('Masukkan bio baru');
    try {
      await denn.updateProfileStatus(text);
      await m.reply('✅ Bio WhatsApp bot berhasil diubah');
    } catch (e) {
      await m.reply('❌ Gagal: ' + e.message);
    }
  }
};
