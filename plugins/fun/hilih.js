export default {
  command: ['hilih'],
  category: 'fun',
  execute: async (denn, m, { text, prefix }) => {
    if (!text) return m.reply(`Contoh: ${prefix}hilih teks di sini`);
    const result = text.replace(/[aiueo]/gi, 'i');
    await m.reply(result);
  }
};