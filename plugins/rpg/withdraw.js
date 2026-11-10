export default {
  command: ['withdraw','wd'],
  category: 'rpg',
  execute: async (denn, m, { text, prefix }) => {
    const { getUser, saveUser, formatMoney, parseAmount } = await import('../../lib/rpg.js');
    const amount = parseAmount(text);
    if (!amount) return m.reply(`Contoh: ${prefix}withdraw 1000`);
    const user = getUser(m.sender);
    if ((user.bank||0) < amount) return m.reply('Saldo bank kurang');
    user.bank -= amount;
    user.money = (user.money||0) + amount;
    saveUser(m.sender, user);
    await m.reply(`🏦 Withdraw ${formatMoney(amount)}\nBank: ${formatMoney(user.bank)}\nCash: ${formatMoney(user.money)}`);
  }
};
