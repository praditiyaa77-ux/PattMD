import axios from 'axios';

export default {
  command: ['quotes', 'quoteen'],
  category: 'tools',
  execute: async (denn, m) => {
    try {
      const { data } = await axios.get('https://api.quotable.io/random', { timeout: 10000 });
      await m.reply(`💬 *Quote*\n\n"${data.content}"\n\n— *${data.author}*`);
    } catch {
      await m.reply('❌ Gagal mengambil quote. Coba lagi.');
    }
  }
};
