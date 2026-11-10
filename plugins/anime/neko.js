import axios from 'axios';

export default {
  command: ['neko'],
  category: 'anime',
  execute: async (denn, m) => {
    await m.reply(global.msg.wait);
    try {
      const { data } = await axios.get('https://api.waifu.pics/sfw/neko', { timeout: 15000 });
      if (!data?.url) throw new Error('No image');
      await denn.sendMessage(m.chat, {
        image: { url: data.url },
        caption: '🐱 *Random Neko*'
      }, { quoted: m });
    } catch (e) {
      try {
        const { data } = await axios.get('https://nekos.best/api/v2/neko', { timeout: 15000 });
        const url = data?.results?.[0]?.url;
        if (!url) throw e;
        await denn.sendMessage(m.chat, { image: { url }, caption: '🐱 *Random Neko*' }, { quoted: m });
      } catch {
        await m.reply('❌ Gagal mengambil neko. Coba lagi.');
      }
    }
  }
};
