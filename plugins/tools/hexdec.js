export default {
  command: ['hexdec'],
  category: 'tools',
  execute: async (denn, m, { text, prefix }) => {
    
    if (!text) return m.reply('Masukkan hex');
    try {
      const dec = Buffer.from(text.replace(/\s/g,''), 'hex').toString('utf8');
      await m.reply(`Decoded:\n${dec}`);
    } catch { await m.reply('❌ Invalid hex'); }
  
  }
};