export default {
  command: ['tebakkimia'],
  category: 'game',
  execute: async (denn, m, { text, prefix }) => {
    const data = [
      {q:'H',a:'hidrogen'},{q:'O',a:'oksigen'},{q:'C',a:'karbon'},
      {q:'Na',a:'natrium'},{q:'Fe',a:'besi'},{q:'Au',a:'emas'},{q:'Ag',a:'perak'}
    ];
    const item = data[Math.floor(Math.random()*data.length)];
    if (!text) return m.reply(`⚗️ *Tebak Unsur*\n\nSimbol: *${item.q}*\n\nJawab: ${prefix}tebakkimia <nama>`);
    if (text.toLowerCase().includes(item.a)) await m.reply(`✅ Benar! ${item.q} = ${item.a}`);
    else await m.reply(`❌ Salah. Jawaban: ${item.a}`);
  }
};
