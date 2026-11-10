export default {
  command: ['cowok', 'cowo'],
  category: 'fun',
  execute: async (denn, m) => {
    const list = ['Ganteng','Maskulin','Softboy','Sigma','Badboy','Gentleman','Cool','Charming','Athletic','Nerd'];
    const r = list[Math.floor(Math.random()*list.length)];
    const pct = Math.floor(Math.random()*41)+60;
    await m.reply(`🔥 *COWOK CHECK*\n\nTipe: *${r}*\nSkor: *${pct}/100*`);
  }
};
