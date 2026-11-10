export default {
  command: ['listfitur', 'listcmd'],
  category: 'info',
  execute: async (denn, m, { prefix, text }) => {
    const cats = {};
    global.plugins?.forEach(p => {
      const c = p.category || 'other';
      if (!cats[c]) cats[c] = [];
      const cmd = Array.isArray(p.command) ? p.command[0] : p.command;
      if (cmd) cats[c].push(cmd);
    });
    if (text && cats[text.toLowerCase()]) {
      const list = cats[text.toLowerCase()].sort().map(c => prefix + c).join('\n');
      return m.reply(`📂 *${text.toUpperCase()}*\n\n${list}`);
    }
    let out = '📂 *DAFTAR KATEGORI*\n\n';
    for (const [c, cmds] of Object.entries(cats).sort()) {
      out += `• ${c}: ${cmds.length} fitur\n`;
    }
    out += `\nKetik ${prefix}listfitur <kategori> untuk detail`;
    await m.reply(out);
  }
};
