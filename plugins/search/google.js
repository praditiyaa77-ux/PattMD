export default {
  command: ['google', 'gsearch'],
  category: 'search',
  execute: async (denn, m, { text, prefix }) => {
    if (!text) return m.reply(`Contoh: ${prefix}google cara masak nasi`);
    const url = `https://www.google.com/search?q=${encodeURIComponent(text)}`;
    await m.reply(`🔍 *Google*\n\nQuery: *${text}*\n\n${url}`);
  }
};
