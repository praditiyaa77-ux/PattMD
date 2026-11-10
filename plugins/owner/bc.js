export default {
  command: ['bc'],
  category: 'owner',
  execute: async (denn, m, { text, isOwner }) => {
    
    if (!isOwner) return m.reply(global.msg.owner);
    if (!text) return m.reply('Masukkan teks broadcast');
    // simple note: real bc needs chat list, here just confirm
    await m.reply('📢 Broadcast disiapkan (implementasi penuh butuh list chat). Teks: ' + text.slice(0,100));
  
  }
};