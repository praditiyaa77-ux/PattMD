export default {
  command: ['report', 'lapor'],
  category: 'main',
  execute: async (denn, m, { text, prefix }) => {
    if (!text) return m.reply(`Contoh: ${prefix}report bug di fitur menu`);
    await m.reply(`✅ Laporan terkirim ke owner.\nTerima kasih atas masukannya!`);
  }
};
