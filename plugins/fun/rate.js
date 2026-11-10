export default {
  command: ['rate', 'nilai'],
  category: 'fun',
  execute: async (denn, m, { text, prefix }) => {
    if (!text) return m.reply(`Contoh: ${prefix}rate kecantikan aku`);
    const pct = Math.floor(Math.random()*101);
    const bar = '█'.repeat(Math.floor(pct/10)) + '░'.repeat(10-Math.floor(pct/10));
    await m.reply(`📊 *RATE*\n\n${text}\nNilai: *${pct}%*\n[${bar}]`);
  }
};
