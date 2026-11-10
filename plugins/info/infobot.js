export default {
  command: ['infobot', 'botinfo'],
  category: 'info',
  execute: async (denn, m) => {
    await m.reply(`ℹ️ *INFO BOT*\n\nNama: ${global.namabot}\nVersi: ESM Plugin v2.1\nLibrary: Baileys\nTotal Command: ${global.plugins?.size || 0}\nOwner: ${global.namaowner}\n\nKetik .menu untuk daftar fitur.`);
  }
};
