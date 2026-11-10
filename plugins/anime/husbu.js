import axios from 'axios';

export default {
  command: ['husbu', 'husbando'],
  category: 'anime',
  execute: async (denn, m) => {
    await m.reply(global.msg.wait);
    try {
      // waifu.pics doesn't have husbando sfw directly; use nekos.best or waifu.im
      const { data } = await axios.get('https://nekos.best/api/v2/husbando', { timeout: 15000 });
      const url = data?.results?.[0]?.url;
      if (!url) throw new Error('empty');
      await denn.sendMessage(m.chat, {
        image: { url },
        caption: '🔥 *Random Husbu*'
      }, { quoted: m });
    } catch {
      try {
        const { data } = await axios.get('https://api.waifu.im/search/?included_tags=waifu&is_nsfw=false', { timeout: 15000 });
        const url = data?.images?.[0]?.url;
        if (!url) throw new Error('empty');
        await denn.sendMessage(m.chat, { image: { url }, caption: '🔥 *Anime Image*' }, { quoted: m });
      } catch {
        await m.reply('❌ Gagal mengambil husbu. Coba lagi.');
      }
    }
  }
};
