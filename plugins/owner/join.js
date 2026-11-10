export default {
  command: ['join'],
  category: 'owner',
  execute: async (denn, m, { text, isOwner }) => {
    
    if (!isOwner) return m.reply(global.msg.owner);
    if (!text) return m.reply('Masukkan link grup');
    try {
      const link = text.replace('https://chat.whatsapp.com/', '');
      await denn.groupAcceptInvite(link);
      await m.reply('✅ Berhasil join grup');
    } catch (e) { await m.reply('❌ Gagal join: ' + e.message); }
  
  }
};