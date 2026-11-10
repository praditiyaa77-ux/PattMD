import axios from 'axios';

export default {
  command: ['waifu'],
  category: 'anime',
  execute: async (denn, m) => {
    await m.reply(global.msg.wait);
    try {
      const { data } = await axios.get('https://api.waifu.pics/sfw/waifu', { timeout: 15000 });
      if (!data?.url) throw new Error('No image');
      await denn.sendMessage(m.chat, {
        image: { url: data.url },
        caption: '💖 *Random Waifu*'
      }, { quoted: m });
    } catch (e) {
      try {
        const { data } = await axios.get('https://nekos.best/api/v2/waifu', { timeout: 15000 });
        const url = data?.results?.[0]?.url;
        if (!url) throw e;
        await denn.sendMessage(m.chat, { image: { url }, caption: '💖 *Random Waifu*' }, { quoted: m });
      } catch {
        await m.reply('❌ Gagal mengambil waifu. Coba lagi.');
      }
    }
  }
};
