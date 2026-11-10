export default {
  command: ['spotify', 'spotsearch'],
  category: 'search',
  execute: async (denn, m, { text, prefix }) => {
    if (!text) return m.reply(`Contoh: ${prefix}spotify perfect ed sheeran`);
    await m.reply(global.msg?.wait || '⏳ Mencari lagu...');

    try {
      // Gunakan iTunes Search API (gratis, tanpa key)
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(text)}&media=music&limit=5`,
        { signal: AbortSignal.timeout(12000) }
      );
      const data = await res.json();
      const results = data.results || [];
      if (!results.length) return m.reply('❌ Lagu tidak ditemukan.');

      let out = `🎧 *Music Search*\nQuery: *${text}*\n\n`;
      results.forEach((t, i) => {
        out += `${i + 1}. *${t.trackName}*\n`;
        out += `   🎤 ${t.artistName}\n`;
        out += `   💿 ${t.collectionName || '-'}\n`;
        out += `   🔗 ${t.trackViewUrl || t.previewUrl || ''}\n\n`;
      });
      out += `_Preview URL tersedia di link iTunes di atas_`;
      await m.reply(out.trim());
    } catch (e) {
      await m.reply(`❌ Gagal: ${e.message}`);
    }
  }
};
