export default {
  command: ['bucin', 'katabucin'],
  category: 'fun',
  execute: async (denn, m) => {
    const list = [
      'Kamu itu seperti WiFi, tanpa kamu aku lemot.',
      'Kalau cinta itu buta, kenapa aku masih bisa lihat senyummu?',
      'Aku bukan matematikus, tapi aku bisa hitung hari tanpa kamu.',
      'Kamu itu vitamin, karena aku butuh kamu setiap hari.',
      'Jarak jauh bukan masalah, yang penting jarak hati dekat.'
    ];
    await m.reply(`💕 *KATA BUCIN*\n\n${list[Math.floor(Math.random()*list.length)]}`);
  }
};
