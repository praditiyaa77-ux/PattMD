export default {
  command: ['password'],
  category: 'tools',
  execute: async (denn, m, { text, prefix }) => {
    
    const len = parseInt(text) || 12;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let pass = '';
    for (let i=0;i<Math.min(len,64);i++) pass += chars[Math.floor(Math.random()*chars.length)];
    await m.reply(`🔐 Password (${Math.min(len,64)}):\n\`${pass}\``);
  
  }
};