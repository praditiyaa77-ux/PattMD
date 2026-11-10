import axios from 'axios';

export default {
  command: ['faktaunik', 'fact'],
  category: 'tools',
  execute: async (denn, m) => {
    try {
      const { data } = await axios.get('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en', { timeout: 10000 });
      await m.reply(`🧠 *Random Fact*\n\n${data.text}`);
    } catch {
      await m.reply('❌ Gagal mengambil fakta.');
    }
  }
};
