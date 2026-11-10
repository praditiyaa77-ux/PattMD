export default {
  command: ['runtime'],
  category: 'info',
  execute: async (denn, m, { text }) => {
    
    const up = process.uptime();
    const h = Math.floor(up/3600);
    const mnt = Math.floor((up%3600)/60);
    const s = Math.floor(up%60);
    await m.reply(`⏱️ *Runtime Bot*\n${h} jam ${mnt} menit ${s} detik`);
  
  }
};