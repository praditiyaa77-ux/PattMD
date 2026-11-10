export default {
  command: ['judi', 'slotjudi'],
  category: 'rpg',
  execute: async (denn, m, { text, prefix }) => {
    const { getUser, saveUser, formatMoney, parseAmount } = await import('../../lib/rpg.js');
    const bet = parseAmount(text) || 100;
    const user = getUser(m.sender);
    if ((user.money||0) < bet) return m.reply('Saldo tidak cukup');
    const emojis = ['🍒','🍋','🍉','⭐','7️⃣'];
    const a = emojis[Math.floor(Math.random()*emojis.length)];
    const b = emojis[Math.floor(Math.random()*emojis.length)];
    const c = emojis[Math.floor(Math.random()*emojis.length)];
    let win = 0;
    if (a===b && b===c) win = bet * 5;
    else if (a===b || b===c || a===c) win = bet * 2;
    user.money = (user.money||0) - bet + win;
    saveUser(m.sender, user);
    await m.reply(`🎰 *JUDI SLOT*\n\n[ ${a} | ${b} | ${c} ]\n\nTaruhan: ${formatMoney(bet)}\n${win>0?'🎉 Menang +'+formatMoney(win):'💸 Kalah'}\nSaldo: ${formatMoney(user.money)}`);
  }
};
