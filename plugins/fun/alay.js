export default {
  command: ['alay'],
  category: 'fun',
  execute: async (denn, m, { text, prefix }) => {
    if (!text) return m.reply(`Contoh: ${prefix}alay teks di sini`);
    const result = text.split('').map((c,i)=>i%2?c.toUpperCase():c.toLowerCase()).join('');
    await m.reply(result);
  }
};