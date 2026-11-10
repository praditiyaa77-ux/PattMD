export default {
  command: ['bisakah', 'bisa'],
  category: 'fun',
  execute: async (denn, m, { text, prefix }) => {
    if (!text) return m.reply(`Contoh: ${prefix}bisakah aku terbang?`);
    const answers = ['Bisa','Tidak bisa','Bisa banget','Sulit','Mungkin saja','Pasti bisa','Jangan dipaksakan','Dengan usaha iya'];
    await m.reply(`✨ *${answers[Math.floor(Math.random()*answers.length)]}*`);
  }
};
