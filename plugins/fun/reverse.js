export default {
  command: ['reverse'],
  category: 'fun',
  execute: async (denn, m, { text, prefix }) => {
    if (!text) return m.reply(`Contoh: ${prefix}reverse teks di sini`);
    const result = text.split('').reverse().join('');
    await m.reply(result);
  }
};