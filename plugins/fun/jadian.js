export default {
  command: ['jadian', 'jodohin'],
  category: 'fun',
  execute: async (denn, m, { text }) => {
    if (!text || !text.includes('&') && !m.mentionedJid?.length) {
      return m.reply('Tag 2 orang atau tulis: .jadian nama1 & nama2');
    }
    let a, b;
    if (m.mentionedJid?.length >= 2) {
      a = '@' + m.mentionedJid[0].split('@')[0];
      b = '@' + m.mentionedJid[1].split('@')[0];
    } else {
      const parts = text.split(/&|dan|sama/i).map(s => s.trim()).filter(Boolean);
      a = parts[0] || 'Dia';
      b = parts[1] || 'Kamu';
    }
    const pct = Math.floor(Math.random()*101);
    let status = pct > 80 ? 'Cocok banget! 💍' : pct > 50 ? 'Ada chemistry 💕' : pct > 30 ? 'Masih bisa dicoba' : 'Kurang cocok 😅';
    await m.reply(`💘 *JODOH CHECK*\n\n${a} ❤️ ${b}\nKecocokan: *${pct}%*\n${status}`);
  }
};
