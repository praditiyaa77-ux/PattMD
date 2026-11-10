export default {
  command: ['github', 'gh', 'ghsearch'],
  category: 'search',
  execute: async (denn, m, { text, prefix }) => {
    if (!text) return m.reply(`Contoh: ${prefix}github baileys`);
    await m.reply(global.msg?.wait || '⏳ Mencari di GitHub...');

    try {
      const res = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(text)}&sort=stars&order=desc&per_page=5`,
        {
          headers: {
            'User-Agent': 'BotESM/2.1',
            'Accept': 'application/vnd.github+json'
          },
          signal: AbortSignal.timeout(12000)
        }
      );
      const data = await res.json();
      const items = data.items || [];
      if (!items.length) return m.reply('❌ Repository tidak ditemukan.');

      let out = `🐙 *GitHub Search*\nQuery: *${text}*\n\n`;
      items.forEach((r, i) => {
        out += `${i + 1}. *${r.full_name}*\n`;
        out += `   ⭐ ${r.stargazers_count?.toLocaleString('id-ID')} | 🍴 ${r.forks_count}\n`;
        out += `   ${r.description ? r.description.slice(0, 100) : '-'}\n`;
        out += `   🔗 ${r.html_url}\n\n`;
      });
      await m.reply(out.trim());
    } catch (e) {
      await m.reply(`❌ GitHub error: ${e.message}`);
    }
  }
};
