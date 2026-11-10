import axios from 'axios';

export default {
  command: ['cat', 'kucing'],
  category: 'tools',
  execute: async (denn, m) => {
    await m.reply(global.msg.wait);
    try {
      const { data } = await axios.get('https://api.thecatapi.com/v1/images/search', { timeout: 12000 });
      const url = data?.[0]?.url;
      if (!url) throw new Error('empty');
      await denn.sendMessage(m.chat, {
        image: { url },
        caption: '🐱 *Random Cat*'
      }, { quoted: m });
    } catch {
      await m.reply('❌ Gagal ambil gambar kucing.');
    }
  }
};
