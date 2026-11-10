export default {
  command: ['kapankah', 'kapan'],
  category: 'fun',
  execute: async (denn, m, { text, prefix }) => {
    if (!text) return m.reply(`Contoh: ${prefix}kapankah aku kaya?`);
    const answers = ['Besok','Minggu depan','Tahun depan','Tidak akan pernah','Sebentar lagi','Dalam 3 hari','Kapan-kapan','Saat kamu siap','Malam ini','Lusa'];
    await m.reply(`⏳ *${answers[Math.floor(Math.random()*answers.length)]}*`);
  }
};
