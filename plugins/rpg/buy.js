import { getUser, saveUser, parseAmount, formatMoney } from '../../lib/rpg.js';
import { items } from '../../lib/items.js';

export default {
  command: ['buy', 'beli'],
  category: 'rpg',
  execute: async (denn, m, { prefix, text }) => {
    const [itemIdRaw, amountRaw = '1', ...extra] = (text || '').trim().split(/\\s+/);
    if (!itemIdRaw || extra.length) return m.reply(`Format: ${prefix}buy <id_barang> <jumlah>\\nContoh: ${prefix}buy ramuan 2`);
    const itemId = itemIdRaw.toLowerCase();
    const item = items[itemId];
    if (!item) return m.reply(`Barang *${itemId}* tidak tersedia. Cek ${prefix}shop.`);
    const amount = parseAmount(amountRaw, 100);
    if (!amount) return m.reply('Jumlah harus angka bulat antara 1–100.');
    const total = item.price * amount;
    if (!Number.isSafeInteger(total)) return m.reply('Total pembelian terlalu besar.');
    const user = getUser(m.sender);
    if (user.money < total) return m.reply(`Uang tidak cukup.\\nButuh: ${formatMoney(total)}\\nDompet: ${formatMoney(user.money)}`);
    user.money -= total;
    user.inventory[itemId] = (user.inventory[itemId] || 0) + amount;
    saveUser(m.sender, user);
    return m.reply(`✅ Pembelian berhasil\\n${amount}x ${item.name}\\nTotal: ${formatMoney(total)}\\nSisa dompet: ${formatMoney(user.money)}`);
  }
};
