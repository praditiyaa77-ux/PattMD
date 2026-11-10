export default {
  command: ['base64'],
  category: 'tools',
  execute: async (denn, m, { text, prefix }) => {
    
    if (!text) return m.reply('Masukkan teks');
    const enc = Buffer.from(text).toString('base64');
    await m.reply(`🔐 Base64:\n${enc}`);
  
  }
};