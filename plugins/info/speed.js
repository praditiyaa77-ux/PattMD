export default {
  command: ['speed', 'speedtest'],
  category: 'info',
  execute: async (denn, m) => {
    const t = Date.now();
    await m.reply(`⚡ Speed: *${Date.now() - t}ms*\nRuntime: ${Math.floor(process.uptime())}s`);
  }
};
