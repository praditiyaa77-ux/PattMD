export default {
  command: ['tebakangka', 'tebak'],
  category: 'game',
  execute: async (denn, m, { text, prefix }) => {
    const secret = Math.floor(Math.random() * 10) + 1;
    if (!text) return m.reply(`🎯 Tebak angka 1-10\nContoh: ${prefix}tebakangka 5`);
    const guess = parseInt(text);
    if (isNaN(guess) || guess < 1 || guess > 10) return m.reply('Masukkan angka 1-10');
    if (guess === secret) await m.reply(`🎉 Benar! Angkanya *${secret}*`);
    else await m.reply(`❌ Salah! Angkanya *${secret}*. Coba lagi!`);
  }
};