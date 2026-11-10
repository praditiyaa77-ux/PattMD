export default {
  command: ['film', 'movie', 'omdb'],
  category: 'search',
  execute: async (denn, m, { text, prefix }) => {
    if (!text) return m.reply(`Contoh: ${prefix}film inception`);
    await m.reply(global.msg?.wait || '⏳ Mencari film...');

    try {
      // TVMaze search (gratis, tanpa key) + fallback Wikipedia
      const res = await fetch(
        `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(text)}`,
        { signal: AbortSignal.timeout(12000) }
      );
      const data = await res.json();
      const shows = (data || []).slice(0, 5);

      if (!shows.length) {
        // Fallback wiki
        return m.reply(`❌ Tidak ditemukan di TVMaze.\nCoba: ${prefix}wiki ${text}\nAtau: ${prefix}google film ${text}`);
      }

      let out = `🎬 *Film / Series Search*\nQuery: *${text}*\n\n`;
      for (const item of shows) {
        const s = item.show;
        out += `*${s.name}*\n`;
        out += `⭐ ${s.rating?.average || '-'} | ${s.premiered || '-'} | ${s.status || '-'}\n`;
        out += `🎭 ${(s.genres || []).join(', ') || '-'}\n`;
        const summary = (s.summary || '').replace(/<[^>]+>/g, '').slice(0, 150);
        if (summary) out += `${summary}...\n`;
        out += `🔗 ${s.url || s.officialSite || ''}\n\n`;
      }
      await m.reply(out.trim());
    } catch (e) {
      await m.reply(`❌ Gagal: ${e.message}`);
    }
  }
};
