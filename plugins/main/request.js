export default {
  command: ['request', 'req'],
  category: 'main',
  execute: async (denn, m, { text, prefix }) => {
    if (!text) return m.reply(`Contoh: ${prefix}request fitur anime`);
    await m.reply(`✅ Request fitur terkirim!\nOwner akan meninjau permintaanmu.`);
  }
};
