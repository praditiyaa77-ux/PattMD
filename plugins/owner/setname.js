export default {
  command: ['setnamebot', 'setnamabot'],
  category: 'owner',
  execute: async (denn, m, { text, isOwner }) => {
    if (!isOwner) return m.reply(global.msg.owner);
    if (!text) return m.reply('Masukkan nama bot baru');
    global.namabot = text;
    await m.reply(`✅ Nama bot diubah menjadi: *${text}*`);
  }
};
