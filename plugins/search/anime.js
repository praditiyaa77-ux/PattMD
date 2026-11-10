export default {
  command: ['animesearch', 'carianime', 'mal'],
  category: 'search',
  execute: async (denn, m, { text, prefix }) => {
    if (!text) return m.reply(`Contoh: ${prefix}animesearch naruto`);
    await m.reply(global.msg?.wait || '⏳ Mencari anime...');

    try {
      // Jikan API v4 (MyAnimeList unofficial, gratis)
      const res = await fetch(
        `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(text)}&limit=5&sfw=true`,
        {
          headers: { 'User-Agent': 'BotESM/2.1' },
          signal: AbortSignal.timeout(15000)
        }
      );

      if (!res.ok) {
        // Fallback: Wikipedia
        return m.reply(`❌ Jikan API sedang sibuk.\nCoba: ${prefix}wiki ${text}\nAtau: ${prefix}google anime ${text}`);
      }

      const data = await res.json();
      const list = data.data || [];
      if (!list.length) return m.reply(`❌ Anime tidak ditemukan: *${text}*`);

      let out = `🎌 *Anime Search*\nQuery: *${text}*\n\n`;
      for (const a of list) {
        out += `*${a.title}*\n`;
        if (a.title_japanese) out += `🇯🇵 ${a.title_japanese}\n`;
        out += `⭐ ${a.score || '-'} | 📺 ${a.episodes || '?'} eps | ${a.status || '-'}\n`;
        out += `🎭 ${(a.genres || []).map(g => g.name).slice(0, 3).join(', ') || '-'}\n`;
        out += `${(a.synopsis || '').slice(0, 150)}...\n`;
        out += `🔗 ${a.url}\n\n`;
      }
      await m.reply(out.trim());
    } catch (e) {
      await m.reply(`❌ Gagal: ${e.message}\nCoba lagi nanti (rate limit Jikan).`);
    }
  }
};
