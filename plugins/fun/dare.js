const dares = [
  "Kirim voice note bilang 'Aku sayang kamu' ke kontak random.",
  "Ganti foto profil jadi meme selama 1 jam.",
  "Chat crush kamu 'Hai' sekarang.",
  "Post status 'Siapa yang mau jadi pacar aku?'",
  "Nyanyi lagu favorit kamu di voice note.",
  "Tirukan suara hewan favorit kamu.",
  "Ceritakan lelucon terburuk kamu."
];
export default {
  command: ['dare'],
  category: 'fun',
  execute: async (denn, m) => {
    await m.reply(`🔴 *DARE*\n\n${dares[Math.floor(Math.random()*dares.length)]}`);
  }
};