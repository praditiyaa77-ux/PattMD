export default {
  command: ['yts', 'ytsearch'],
  category: 'search',
  execute: async (denn, m, { text, prefix }) => {
    if (!text) return m.reply(`Contoh: ${prefix}yts lagu indo`);
    await m.reply(global.msg.wait);
    try {
      const yts = (await import('yt-search')).default;
      const r = await yts(text);
      const vids = (r.videos || []).slice(0, 5);
      if (!vids.length) return m.reply('❌ Tidak ada hasil.');
      let out = `🎬 *YouTube Search*\n\n`;
      vids.forEach((v, i) => {
        out += `${i + 1}. *${v.title}*\n`;
        out += `   ⏱️ ${v.timestamp || '-'} | 👁️ ${v.views || '-'}\n`;
        out += `   🔗 ${v.url}\n\n`;
      });
      await m.reply(out);
    } catch (e) {
      await m.reply('❌ Gagal search: ' + (e.message || e));
    }
  }
};
