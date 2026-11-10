import { getUser as getRpgUser, formatMoney } from '../../lib/rpg.js';
import { getUser as getRegUser } from '../../lib/userdb.js';
import { items } from '../../lib/items.js';

export default {
    command: ['profile', 'me', 'profil', 'inv', 'inventory', 'tas'],
    category: 'rpg',
    execute: async (denn, m, { prefix }) => {
        // Ambil data RPG (uang, level, inventory, dll)
        const rpgUser = getRpgUser(m.sender);
        // Ambil data Registrasi (nama asli, umur, serial)
        const regUser = getRegUser(m.sender);

        // Tentukan nama tampilan (prioritaskan nama registrasi, jika tidak ada pakai pushName)
        const displayName = regUser?.name || m.pushName || 'Tanpa Nama';
        
        // Format tanggal registrasi
        let regDate = '-';
        let serial = '-';
        let age = '-';

        if (regUser) {
            serial = regUser.serial;
            age = regUser.age + ' Tahun';
            regDate = new Date(regUser.registeredAt).toLocaleDateString('id-ID', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            });
        }

        // ─── BAGIAN 1: USER PROFILE ───
        let text = `┏━━━「 *USER PROFILE* 」━━━┓\n\n`;
        text += `👤 *Nama:* ${displayName}\n`;
        text += `🎂 *Umur:* ${age}\n`;
        text += `🆔 *Serial Number:* \`${serial}\`\n`;
        text += `📅 *Terdaftar:* ${regDate}\n\n`;
        
        text += `╭───────────────\n`;
        text += `│ 📊 *Level:* ${rpgUser.level}\n`;
        text += `│ ✨ *XP:* ${rpgUser.xp} / ${rpgUser.level * 100}\n`;
        text += `│ ❤️ *Health:* ${rpgUser.health}/100\n`;
        text += `│ 💰 *Uang:* ${formatMoney(rpgUser.money)}\n`;
        text += `│ 🏦 *Bank:* ${formatMoney(rpgUser.bank)}\n`;
        text += `│ 🎟️ *Limit:* ${rpgUser.limit}\n`;
        text += `╰───────────────\n\n`;

        // ─── BAGIAN 2: INVENTORY ───
        text += `┏━━━「 *I N V E N T O R Y* 」━━━┓\n`;
        
        const invKeys = Object.keys(rpgUser.inventory || {});
        
        if (invKeys.length === 0) {
            text += `┃ 🎒 Tas kamu masih kosong!\n`;
            text += `┃ Beli barang di toko dengan *.shop*\n`;
        } else {
            let totalItem = 0;
            let itemLines = [];
            
            for (const [id, qty] of Object.entries(rpgUser.inventory)) {
                if (items[id] && qty > 0) {
                    itemLines.push(`┃ 📦 ${items[id].name} (${qty}x)`);
                    totalItem += qty;
                }
            }
            
            if (itemLines.length > 0) {
                text += itemLines.join('\n') + '\n';
                text += `┃\n┃ _Total item: ${totalItem}_\n`;
            } else {
                text += `┃ 🎒 Tas kamu masih kosong!\n`;
            }
        }
        
        text += `┗━━━━━━━━━━━━━━━━\n\n`;

        text += `_Ketik \`${prefix}shop\` untuk membeli barang._`;

        // Kirim dengan Foto Profil WhatsApp
        try {
            const ppUrl = await denn.profilePictureUrl(m.sender, 'image');
            await denn.sendMessage(m.chat, { image: { url: ppUrl }, caption: text.trim() }, { quoted: m });
        } catch {
            // Jika user tidak punya foto profil atau gagal load, kirim teks saja
            await m.reply(text.trim());
        }
    }
};