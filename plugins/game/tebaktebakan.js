export default {
  command: ['tebaktebakan','ttt2'],
  category: 'game',
  execute: async (denn, m, { text, prefix }) => {
    const data = [
      {q:'Buah apa yang suka motoran?', a:'apel (a-pel)'},
      {q:'Kenapa sepeda tidak bisa berdiri sendiri?', a:'karena lelah (two-tired)'}
    ];
    const item = data[Math.floor(Math.random()*data.length)];
    if (!text) return m.reply(`🤔 *Tebak-tebakan*\n\n${item.q}\n\nJawab: ${prefix}tebaktebakan <jawaban>`);
    await m.reply(`Jawaban: ${item.a}`);
  }
};
