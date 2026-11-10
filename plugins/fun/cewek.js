export default {
  command: ['cewek', 'cewe'],
  category: 'fun',
  execute: async (denn, m) => {
    const list = ['Cantik natural','Manis','Imut','Anggun','Tegas','Soft girl','Tomboy','Elegan','Cute','Glowing'];
    const r = list[Math.floor(Math.random()*list.length)];
    const pct = Math.floor(Math.random()*41)+60;
    await m.reply(`🌸 *CEWEK CHECK*\n\nTipe: *${r}*\nSkor: *${pct}/100*`);
  }
};
