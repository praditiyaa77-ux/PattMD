export default {
  command: ['donasi', 'donate', 'sewa'],
  category: 'info',
  execute: async (denn, m) => {
    await m.reply(`🙏 *DONASI / SEWA BOT*\n\nJika ingin support atau sewa bot, hubungi owner.\n\nOwner: ${global.owner}\n\nTerima kasih sudah memakai bot ini!`);
  }
};
