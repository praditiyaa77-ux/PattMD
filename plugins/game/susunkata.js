export default {
  command: ['susunkata'],
  category: 'game',
  execute: async (denn, m, { text, prefix }) => {
    const words = ['sekolah','komputer','televisi','sepeda','makanan','olahraga'];
    const word = words[Math.floor(Math.random()*words.length)];
    const shuffled = word.split('').sort(() => Math.random()-0.5).join('');
    if (!text) return m.reply(`🔤 *Susun Kata*\n\nSusun: *${shuffled}*\n\nJawab: ${prefix}susunkata <kata>`);
    if (text.toLowerCase() === word) await m.reply(`✅ Benar! *${word}*`);
    else await m.reply(`❌ Salah. Jawaban: *${word}*`);
  }
};
