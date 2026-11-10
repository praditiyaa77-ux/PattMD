import { items } from '../../lib/items.js';

export default {
    command: ['shop', 'toko'],
    category: 'rpg',
    execute: async (denn, m, { prefix }) => {
        let txt = `🏪 *TOKO CENTRAL* 🏪\n\n`;
        
        for (const [id, item] of Object.entries(items)) {
            txt += `📦 *${item.name}* [ID: ${id}]\n`;
            txt += `└ 💰 Harga: $${item.price.toLocaleString('id-ID')}\n`;
            txt += `└ 📝 Deskripsi: ${item.desc}\n\n`;
        }

        txt += `_Gunakan ${prefix}buy <id> <jumlah> untuk membeli._\n_Contoh: ${prefix}buy ramuan 2_`;
        
        await m.reply(txt);
    }
};