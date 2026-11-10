import { getUser, saveUser, parseAmount, formatMoney } from '../../lib/rpg.js';
import { items } from '../../lib/items.js';

export default {
  command: ['sell', 'jual'],
  category: 'rpg',
  execute: async (denn, m, { prefix, text }) => {
    const [itemIdRaw, amountRaw = '1', ...extra] = (text || '').trim().split(/\\s+/);
    if (!itemIdRaw || extra.length) return m.reply(`Format: ${prefix}sell <id_barang> <jumlah>\\nContoh: ${prefix}sell ikan_lele 2`);
    const itemId = itemIdRaw.toLowerCase();
    const item = items[itemId];
    if (!item) return m.reply('ID barang tidak ditemukan.');
    const amount = parseAmount(amountRaw, 100);
    if (!amount) return m.reply('Jumlah harus angka bulat antara 1–100.');
    const user = getUser(m.sender);
    if ((user.inventory[itemId] || 0) < amount) return m.reply(`Jumlah ${item.name} di tas tidak cukup.`);
    const total = Math.floor(item.price * 0.5) * amount;
    user.inventory[itemId] -= amount;
    if (!user.inventory[itemId]) delete user.inventory[itemId];
    user.money += total;
    saveUser(m.sender, user);
    return m.reply(`✅ Berhasil menjual ${amount}x ${item.name}\\nDiterima: ${formatMoney(total)}\\nDompet: ${formatMoney(user.money)}`);
  }
};
