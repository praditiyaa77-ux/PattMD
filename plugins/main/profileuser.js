export default {
  command: ['profile', 'profil'],
  category: 'main',
  execute: async (denn, m) => {
    const name = m.pushName || m.sender.split('@')[0];
    await m.reply(`👤 *PROFILE*\n\nNama: ${name}\nNomor: ${m.sender.split('@')[0]}\nChat: ${m.isGroup ? 'Grup' : 'Private'}`);
  }
};
