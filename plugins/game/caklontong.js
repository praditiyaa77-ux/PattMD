export default {
  command: ['caklontong'],
  category: 'game',
  execute: async (denn, m, { text, prefix }) => {
    const data = [
      {q:'Apa yang lebih besar dari gajah tapi lebih ringan dari udara?', a:'bayangan gajah'},
      {q:'Apa yang bisa jalan tapi tidak punya kaki?', a:'jam'},
      {q:'Apa yang selalu naik tapi tidak pernah turun?', a:'umur'}
    ];
    const item = data[Math.floor(Math.random()*data.length)];
    if (!text) return m.reply(`🤡 *Cak Lontong*\n\n${item.q}\n\nJawab: ${prefix}caklontong <jawaban>`);
    if (text.toLowerCase().includes(item.a.split(' ')[0])) await m.reply(`✅ Benar! ${item.a}`);
    else await m.reply(`❌ Salah. Jawaban: ${item.a}`);
  }
};
