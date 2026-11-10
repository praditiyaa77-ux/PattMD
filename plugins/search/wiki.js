import axios from 'axios';

export default {
  command: ['wiki', 'wikipedia'],
  category: 'search',
  execute: async (denn, m, { text, prefix }) => {
    if (!text) return m.reply(`Contoh: ${prefix}wiki indonesia`);
    await m.reply(global.msg.wait);
    try {
      const { data } = await axios.get(
        `https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(text)}`,
        { timeout: 12000 }
      );
      let caption = `📚 *${data.title}*\n\n${(data.extract || '').slice(0, 900)}`;
      if (data.content_urls?.desktop?.page) caption += `\n\n🔗 ${data.content_urls.desktop.page}`;
      if (data.thumbnail?.source) {
        await denn.sendMessage(m.chat, { image: { url: data.thumbnail.source }, caption }, { quoted: m });
      } else {
        await m.reply(caption);
      }
    } catch {
      await m.reply('❌ Tidak ditemukan di Wikipedia ID. Coba kata kunci lain.');
    }
  }
};
