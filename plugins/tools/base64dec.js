export default {
  command: ['base64dec'],
  category: 'tools',
  execute: async (denn, m, { text, prefix }) => {
    
    if (!text) return m.reply('Masukkan base64');
    try {
      const dec = Buffer.from(text, 'base64').toString('utf8');
      await m.reply(`🔓 Decoded:\n${dec}`);
    } catch { await m.reply('❌ Invalid base64'); }
  
  }
};