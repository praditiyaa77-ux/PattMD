export default {
  command: ['deposit','depo'],
  category: 'rpg',
  execute: async (denn, m, { text, prefix }) => {
    const { getUser, saveUser, formatMoney, parseAmount } = await import('../../lib/rpg.js');
    const amount = parseAmount(text);
    if (!amount) return m.reply(`Contoh: ${prefix}deposit 1000`);
    const user = getUser(m.sender);
    if ((user.money||0) < amount) return m.reply('Saldo kurang');
    user.money -= amount;
    user.bank = (user.bank||0) + amount;
    saveUser(m.sender, user);
    await m.reply(`🏦 Deposit ${formatMoney(amount)}\nBank: ${formatMoney(user.bank)}\nCash: ${formatMoney(user.money)}`);
  }
};
