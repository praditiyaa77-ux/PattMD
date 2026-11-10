export default {
  command: ['tf', 'transfer'],
  category: 'rpg',
  execute: async (denn, m, { text, prefix, getTarget }) => {
    const { getUser, saveUser, formatMoney, parseAmount } = await import('../../lib/rpg.js');
    const target = getTarget();
    if (!target || !text) return m.reply(`Contoh: ${prefix}tf @user 1000`);
    const amount = parseAmount(text.replace(/[^0-9]/g,''));
    if (!amount) return m.reply('Jumlah tidak valid');
    const user = getUser(m.sender);
    const targetUser = getUser(target);
    if ((user.money||0) < amount) return m.reply('Saldo tidak cukup');
    user.money -= amount;
    targetUser.money = (targetUser.money||0) + amount;
    saveUser(m.sender, user);
    saveUser(target, targetUser);
    await m.reply(`💸 *TRANSFER*\n\nBerhasil transfer ${formatMoney(amount)} ke @${target.split('@')[0]}\nSisa saldo: ${formatMoney(user.money)}`);
  }
};
