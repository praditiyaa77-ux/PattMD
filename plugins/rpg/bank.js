import { getUser, saveUser, parseAmount, formatMoney } from '../../lib/rpg.js';

export default {
  command: ['bank', 'atm', 'nabung', 'tarik'],
  category: 'rpg',
  execute: async (denn, m, { prefix, command, text }) => {
    const user = getUser(m.sender);
    if (command === 'bank' || command === 'atm') {
      return m.reply(`🏦 *BANK CENTRAL*\\n\\n👤 Pemilik: *${user.name || m.pushName || 'Pemain'}*\\n💵 Dompet: *${formatMoney(user.money)}*\\n🏦 Tabungan: *${formatMoney(user.bank)}*\\n\\nGunakan ${prefix}nabung <jumlah> atau ${prefix}tarik <jumlah>.`);
    }
    const amount = parseAmount((text || '').trim(), 1000000000);
    if (!amount) return m.reply(`Masukkan jumlah bulat yang valid.\\nContoh: ${prefix}${command} 5000`);
    if (amount < 100) return m.reply('Minimal transaksi adalah $100.');
    if (command === 'nabung') {
      if (user.money < amount) return m.reply('Uang di dompet tidak cukup.');
      user.money -= amount;
      user.bank += amount;
    } else {
      if (user.bank < amount) return m.reply('Saldo bank tidak cukup.');
      user.bank -= amount;
      user.money += amount;
    }
    saveUser(m.sender, user);
    return m.reply(`✅ Transaksi berhasil\\n💵 Dompet: ${formatMoney(user.money)}\\n🏦 Bank: ${formatMoney(user.bank)}`);
  }
};
