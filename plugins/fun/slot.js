export default {
  command: ['slot'],
  category: 'fun',
  execute: async (denn, m) => {
    const emojis = ['🍒','🍋','🍊','🍉','⭐','7️⃣','💎','🔔'];
    const a = emojis[Math.floor(Math.random()*emojis.length)];
    const b = emojis[Math.floor(Math.random()*emojis.length)];
    const c = emojis[Math.floor(Math.random()*emojis.length)];
    const win = a===b && b===c;
    await m.reply(`🎰 *${'slot'.toUpperCase()}*\n\n[ ${a} | ${b} | ${c} ]\n\n${win?'🎉 MENANG!':'Coba lagi ya!'}`);
  }
};