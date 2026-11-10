import { getUser, saveUser, addXP } from '../../lib/rpg.js';

export default {
    command: ['mancing', 'fishing'],
    category: 'rpg',
    execute: async (denn, m) => {
        const user = getUser(m.sender);
        
        // Cek apakah punya pancing
        if (!user.inventory['pancing'] || user.inventory['pancing'] < 1) {
            return m.reply(`❌ Kamu tidak punya *Pancing*!\nBeli dulu di toko dengan command *.buy pancing 1*`);
        }

        const cooldown = 60000; // 1 Menit
        const now = Date.now();

        if (user.lastMancing && now - user.lastMancing < cooldown) {
            const timeLeft = cooldown - (now - user.lastMancing);
            const seconds = Math.ceil(timeLeft / 1000);
            return m.reply(`🎣 Sabar... Ikan sedang berkumpul.\nTunggu *${seconds} detik* lagi.`);
        }

        // Peluang Hasil Mancing
        const roll = Math.random();
        let hasilId = '';
        let xpDidapat = 15;

        if (roll < 0.1) {
            hasilId = 'ikan_hiu'; // 10% Hiu
            xpDidapat = 50;
        } else if (roll < 0.5) {
            hasilId = 'ikan_lele'; // 40% Lele
            xpDidapat = 25;
        } else {
            hasilId = 'sepatu_bekas'; // 50% Sampah
            xpDidapat = 5;
        }

        // Simpan
        if (!user.inventory[hasilId]) user.inventory[hasilId] = 0;
        user.inventory[hasilId] += 1;
        user.lastMancing = now;
        saveUser(m.sender, user);

        const updatedUser = addXP(m.sender, xpDidapat);

        await m.reply(`🎣 *MANCING SELESAI!*\n\nKamu mendapatkan: *1x ${hasilId.replace('_', ' ').toUpperCase()}*\n✨ XP: *+${xpDidapat}*\n\n_Cek tasmu dengan .inv_`);
    }
};