export default {
  command: ['npm', 'npmsearch'],
  category: 'search',
  execute: async (denn, m, { text, prefix }) => {
    if (!text) return m.reply(`Contoh: ${prefix}npm baileys`);
    await m.reply(global.msg?.wait || '⏳ Mencari di NPM...');

    try {
      const res = await fetch(
        `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(text)}&size=5`,
        { signal: AbortSignal.timeout(12000) }
      );
      const data = await res.json();
      const items = data.objects || [];
      if (!items.length) return m.reply('❌ Package tidak ditemukan.');

      let out = `📦 *NPM Search*\nQuery: *${text}*\n\n`;
      items.forEach((obj, i) => {
        const p = obj.package;
        out += `${i + 1}. *${p.name}* \`v${p.version}\`\n`;
        out += `   ${p.description ? p.description.slice(0, 100) : '-'}\n`;
        out += `   🔗 https://www.npmjs.com/package/${p.name}\n\n`;
      });
      await m.reply(out.trim());
    } catch (e) {
      await m.reply(`❌ NPM error: ${e.message}`);
    }
  }
};
