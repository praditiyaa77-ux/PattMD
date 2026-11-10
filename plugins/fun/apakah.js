export default {
  command: ['apakah', 'apa'],
  category: 'fun',
  execute: async (denn, m, { text, prefix }) => {
    if (!text) return m.reply(`Contoh: ${prefix}apakah aku ganteng?`);
    const answers = ['Ya','Tidak','Mungkin','Sangat mungkin','Jangan harap','Pasti','Ragu-ragu','Coba tanya lagi','Sudah jelas','Rahasia'];
    await m.reply(`🔮 *${answers[Math.floor(Math.random()*answers.length)]}*`);
  }
};
