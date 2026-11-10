export default {
  command: ['tanggal'],
  category: 'info',
  execute: async (denn, m, { text }) => {
    
    const now = new Date();
    await m.reply(`📅 *Tanggal*\n${now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
  
  }
};