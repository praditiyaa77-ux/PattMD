export default {
  command: ['tebakkata', 'guessword'],
  category: 'game',
  execute: async (denn, m, { text, prefix }) => {
    const words = ['komputer','whatsapp','javascript','indonesia','sekolah','makanan','olahraga','musik','film','buku'];
    const word = words[Math.floor(Math.random()*words.length)];
    const hint = word[0] + '_'.repeat(word.length-2) + word[word.length-1];
    if (!text) return m.reply(`🔤 *Tebak Kata*\n\nHint: ${hint} (${word.length} huruf)\n\nJawab: ${prefix}tebakkata <jawaban>`);
    if (text.toLowerCase() === word) await m.reply(`✅ Benar! Jawabannya *${word}*`);
    else await m.reply(`❌ Salah. Jawaban: *${word}*`);
  }
};
