export default {
  command: ['server'],
  category: 'info',
  execute: async (denn, m, { text }) => {
    
    const os = await import('os');
    const total = (os.totalmem()/1024/1024/1024).toFixed(2);
    const free = (os.freemem()/1024/1024/1024).toFixed(2);
    const used = (total - free).toFixed(2);
    await m.reply(`🖥️ *Server Info*\nPlatform: ${os.platform()}\nArch: ${os.arch()}\nCPU: ${os.cpus()[0]?.model || '-'}\nRAM: ${used} / ${total} GB\nUptime OS: ${(os.uptime()/3600).toFixed(1)} jam`);
  
  }
};