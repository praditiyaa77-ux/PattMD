export default {
  command: ['tebakbendera'],
  category: 'game',
  execute: async (denn, m, { text, prefix }) => {
    const data = [
      {f:'🇮🇩', a:'indonesia'},{f:'🇯🇵', a:'jepang'},{f:'🇰🇷', a:'korea selatan'},
      {f:'🇺🇸', a:'amerika serikat'},{f:'🇬🇧', a:'inggris'},{f:'🇫🇷', a:'perancis'},
      {f:'🇩🇪', a:'jerman'},{f:'🇸🇦', a:'arab saudi'},{f:'🇲🇾', a:'malaysia'},{f:'🇸🇬', a:'singapura'}
    ];
    const item = data[Math.floor(Math.random()*data.length)];
    if (!text) return m.reply(`🚩 *Tebak Bendera*\n\n${item.f}\n\nJawab: ${prefix}tebakbendera <negara>`);
    if (text.toLowerCase().includes(item.a.split(' ')[0])) await m.reply(`✅ Benar! Itu bendera *${item.a}*`);
    else await m.reply(`❌ Salah. Jawaban: *${item.a}*`);
  }
};
