export default {
  command: ['rules', 'peraturan'],
  category: 'info',
  execute: async (denn, m) => {
    await m.reply(`📜 *RULES BOT*\n\n1. Jangan spam command\n2. Jangan kirim konten terlarang\n3. Hormati owner & admin\n4. Bot bisa off sewaktu-waktu\n5. Gunakan fitur dengan bijak\n\nLanggar = ban / block.`);
  }
};
