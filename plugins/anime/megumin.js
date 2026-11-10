import axios from 'axios';

export default {
  command: ['megumin'],
  category: 'anime',
  execute: async (denn, m) => {
    await m.reply(global.msg.wait);
    try {
      const { data } = await axios.get('https://api.waifu.pics/sfw/megumin', { timeout: 15000 });
      await denn.sendMessage(m.chat, {
        image: { url: data.url },
        caption: '💥 *Megumin — EXPLOSION!*'
      }, { quoted: m });
    } catch {
      await m.reply('❌ Gagal. Coba lagi nanti.');
    }
  }
};
