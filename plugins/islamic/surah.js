export default {
  command: ['surah','surat'],
  category: 'islamic',
  execute: async (denn, m, { text, prefix }) => {
    if (!text) return m.reply(`Contoh: ${prefix}surah al-fatihah`);
    await m.reply(`📖 Surah *${text}*\n\n_Untuk teks lengkap, gunakan aplikasi Quran atau API Quran._`);
  }
};
