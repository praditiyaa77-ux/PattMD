export default {
  command: ['qr', 'qrcode'],
  category: 'tools',
  execute: async (denn, m, { text, prefix }) => {
    if (!text) return m.reply(`Contoh: ${prefix}qr https://google.com`);
    // Use public QR API
    try {
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
      await denn.sendMessage(m.chat, { image: { url }, caption: `📱 QR Code:\n${text}` }, { quoted: m });
    } catch (e) {
      await m.reply('❌ Gagal buat QR: ' + e.message);
    }
  }
};
