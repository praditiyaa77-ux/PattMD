export default {
  command: ['taruhan','bet'],
  category: 'rpg',
  execute: async (denn, m, { text, prefix }) => {
    const { getUser, saveUser, formatMoney, parseAmount } = await import('../../lib/rpg.js');
    const amount = parseAmount(text);
    if (!amount) return m.reply(`Contoh: ${prefix}taruhan 1000`);
    const user = getUser(m.sender);
    if ((user.money||0) < amount) return m.reply('Saldo kurang');
    const win = Math.random() > 0.5;
    if (win) {
      user.money += amount;
      await m.reply(`🟢 Menang! +${formatMoney(amount)}\nSaldo: ${formatMoney(user.money)}`);
    } else {
      user.money -= amount;
      await m.reply(`🔴 Kalah! -${formatMoney(amount)}\nSaldo: ${formatMoney(user.money)}`);
    }
    saveUser(m.sender, user);
  }
};
