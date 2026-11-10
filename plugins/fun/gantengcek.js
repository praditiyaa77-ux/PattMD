export default {
  command: ['gantengcek', 'handsome'],
  category: 'fun',
  execute: async (denn, m, { text }) => {
    const target = text || m.sender.split('@')[0];
    const pct = Math.floor(Math.random()*101);
    await m.reply(`😎 *GANTENG CHECK*\n\nTarget: ${target}\nSkor: *${pct}%*`);
  }
};
