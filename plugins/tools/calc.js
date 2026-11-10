export default {
  command: ['calc'],
  category: 'tools',
  execute: async (denn, m, { text, prefix }) => {
    
    try {
      const safe = text.replace(/[^0-9+\-*/().%\s]/g, '');
      if (!safe) return m.reply('Masukkan ekspresi matematika!');
      const result = Function('"use strict"; return (' + safe + ')')();
      await m.reply(`🔢 *Hasil:* ${result}`);
    } catch { await m.reply('❌ Ekspresi tidak valid'); }
  
  }
};