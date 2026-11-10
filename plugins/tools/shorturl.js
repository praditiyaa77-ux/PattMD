export default {
  command: ['short', 'shorturl'],
  category: 'tools',
  execute: async (denn, m, { text, prefix }) => {
    if (!text || !text.startsWith('http')) return m.reply(`Contoh: ${prefix}short https://example.com`);
    try {
      const axios = (await import('axios')).default;
      const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(text)}`, { timeout: 10000 });
      await m.reply(`🔗 *Short URL*\n\nAsli: ${text}\nPendek: ${res.data}`);
    } catch (e) {
      await m.reply('❌ Gagal memendekkan URL');
    }
  }
};
