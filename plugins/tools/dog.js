import axios from 'axios';

export default {
  command: ['dog', 'anjing'],
  category: 'tools',
  execute: async (denn, m) => {
    await m.reply(global.msg.wait);
    try {
      const { data } = await axios.get('https://dog.ceo/api/breeds/image/random', { timeout: 12000 });
      await denn.sendMessage(m.chat, {
        image: { url: data.message },
        caption: '🐶 *Random Dog*'
      }, { quoted: m });
    } catch {
      await m.reply('❌ Gagal ambil gambar anjing.');
    }
  }
};
