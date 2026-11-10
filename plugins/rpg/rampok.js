import { getUser, saveUser, addXP } from '../../lib/rpg.js';

export default {
    command: ['rampok', 'rob'],
    category: 'rpg',
    execute: async (denn, m, { getTarget, prefix }) => {
        const targetJid = getTarget();
        if (!targetJid) return m.reply(`Tag orang yang mau dirampok!\nContoh: ${prefix}rampok @teman`);
        if (targetJid === m.sender) return m.reply('❌ Kamu tidak bisa merampok dirimu sendiri!');

        const user = getUser(m.sender);
        const target = getUser(targetJid);
        const targetName = target.name || targetJid.split('@')[0];

        // Cek Senjata
        if (!user.inventory['pedang'] || user.inventory['pedang'] < 1) {
            return m.reply(`❌ Kamu butuh *Pedang Kayu* untuk merampok!\nBeli di toko dengan *.buy pedang 1*`);
        }

        if (user.health <= 20) return m.reply(`😫 Darahmu terlalu rendah (${user.health}/100) untuk merampok. Minum ramuan dulu!`);
        if (target.health <= 0) return m.reply(`❌ Target sedang sekarat, jangan dirampok!`);
        if (target.money < 500) return m.reply(`❌ Targetnya miskin, uang di dompetnya kurang dari $500.`);

        // Peluang Sukses 60%
        const sukses = Math.random() < 0.6;

        if (sukses) {
            // Curi 20-40% uang korban
            const curiPersen = Math.floor(Math.random() * 20) + 20;
            const uangDicuri = Math.floor((target.money * curiPersen) / 100);

            user.money += uangDicuri;
            target.money -= uangDicuri;
            
            // Korban kehilangan darah
            target.health = Math.max(0, target.health - 20);

            saveUser(m.sender, user);
            saveUser(targetJid, target);
            const xpResult = addXP(m.sender, 50);

            await m.reply(`🔪 *BERHASIL MERAMPOK!*\n\nKamu merampok *${targetName}* dan mendapatkan *$${uangDicuri.toLocaleString('id-ID')}*!\n\n_Target kehilangan 20 HP.${xpResult.levelsGained ? ` Kamu naik ${xpResult.levelsGained} level!` : ''}_`);
        } else {
            // Gagal rampok: Denda dan kehilangan darah
            const denda = 1500;
            user.money = Math.max(0, user.money - denda);
            user.health = Math.max(0, user.health - 30);

            saveUser(m.sender, user);

            await m.reply(`🚨 *GAGAL MERAMPOK!*\n\nAksi kamu ketahuan warga! Kamu didenda *$${denda}* dan dipukuli hingga kehilangan *30 HP*.\n\n_Sisa uangmu: $${user.money}_`);
        }
    }
};