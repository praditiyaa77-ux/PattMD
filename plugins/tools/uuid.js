export default {
  command: ['uuid'],
  category: 'tools',
  execute: async (denn, m, { text, prefix }) => {
    
    const crypto = await import('crypto');
    await m.reply(`🆔 UUID:\n${crypto.randomUUID()}`);
  
  }
};