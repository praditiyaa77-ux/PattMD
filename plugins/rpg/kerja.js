import { getUser, saveUser, addXP } from '../../lib/rpg.js';

export default {
    command: ['kerja', 'work'],
    category: 'rpg',
    execute: async (denn, m) => {
        const user = getUser(m.sender);
        const cooldown = 300000; // 5 Menit
        const now = Date.now();

        if (user.lastKerja && now - user.lastKerja < cooldown) {
            const timeLeft = cooldown - (now - user.lastKerja);
            const minutes = Math.floor(timeLeft / 60000);
            const seconds = Math.floor((timeLeft % 60000) / 1000);
            
            return m.reply(`😫 Kamu masih kelelahan!\nIstirahat selama *${minutes} menit ${seconds} detik* lagi.`);
        }

        const jobs = [
            { name: "Kuli Bangunan", pay: 1500 },
            { name: "Kurir Paket", pay: 2000 },
            { name: "Programmer", pay: 3500 },
            { name: "Driver Ojek", pay: 1800 },
            { name: "Barista Cafe", pay: 2200 }
        ];

        const job = jobs[Math.floor(Math.random() * jobs.length)];
        const bonusXP = Math.floor(Math.random() * 20) + 10; // XP Random 10-30

        user.money += job.pay;
        user.lastKerja = now;
        saveUser(m.sender, user);
        
        const updatedUser = addXP(m.sender, bonusXP);

        await m.reply(`💼 *KERJA SELESAI!*\n\nKamu bekerja sebagai *${job.name}*.\n\n💰 Gaji: *$${job.pay.toLocaleString('id-ID')}*\n✨ XP didapat: *+${bonusXP}*\n\n_Level: ${updatedUser.level} (${updatedUser.xp}/${updatedUser.level * 100} XP)${updatedUser.levelsGained ? `\\n🎉 Naik ${updatedUser.levelsGained} level!` : ''}_`);
    }
};