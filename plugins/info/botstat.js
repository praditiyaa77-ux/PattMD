export default {
  command: ['botstat', 'statbot'],
  category: 'info',
  execute: async (denn, m) => {
    const os = await import('os');
    const up = process.uptime();
    const h = Math.floor(up/3600), min = Math.floor((up%3600)/60), s = Math.floor(up%60);
    await m.reply(`🤖 *BOT STATUS*\n\nNama: ${global.namabot}\nOwner: ${global.namaowner}\nTotal Fitur: ${global.plugins?.size || 0}\nRuntime: ${h}j ${min}m ${s}s\nPlatform: ${os.platform()}\nNode: ${process.version}\nMode: ${global.db?.public ? 'Public' : 'Self'}`);
  }
};
