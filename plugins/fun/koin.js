export default {
  command: ['koin'],
  category: 'fun',
  execute: async (denn, m) => {
    const emojis = ['🍒','🍋','🍊','🍉','⭐','7️⃣','💎','🔔'];
    const a = emojis[Math.floor(Math.random()*emojis.length)];
    const b = emojis[Math.floor(Math.random()*emojis.length)];
    const c = emojis[Math.floor(Math.random()*emojis.length)];
    const win = a===b && b===c;
    await m.reply(`🎰 *${'koin'.toUpperCase()}*\n\n[ ${a} | ${b} | ${c} ]\n\n${win?'🎉 MENANG!':'Coba lagi ya!'}`);
  }
};