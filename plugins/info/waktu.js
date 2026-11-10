export default {
  command: ['waktu'],
  category: 'info',
  execute: async (denn, m, { text }) => {
    
    const now = new Date();
    const opts = { timeZone: 'Asia/Jakarta', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    await m.reply(`🕒 *Waktu Sekarang*\n${now.toLocaleString('id-ID', opts)} WIB`);
  
  }
};