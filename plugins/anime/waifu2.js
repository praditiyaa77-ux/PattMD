import axios from 'axios';

export default {
  command: ['waifu2', 'randomwaifu'],
  category: 'anime',
  execute: async (denn, m) => {
    await m.reply(global.msg.wait);
    try {
      const tags = ['waifu', 'maid', 'uniform', 'oppai'];
      const tag = tags[Math.floor(Math.random() * tags.length)];
      const { data } = await axios.get(`https://api.waifu.im/search/?included_tags=${tag}&is_nsfw=false`, { timeout: 15000 });
      const img = data?.images?.[0];
      if (!img?.url) throw new Error('empty');
      await denn.sendMessage(m.chat, {
        image: { url: img.url },
        caption: `💖 *Waifu* (${tag})`
      }, { quoted: m });
    } catch {
      await m.reply('❌ Gagal. Coba .waifu');
    }
  }
};
