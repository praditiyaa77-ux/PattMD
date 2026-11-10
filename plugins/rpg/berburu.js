import { getUser, saveUser, addXP, formatMoney } from '../../lib/rpg.js';

export default {
  command: ['berburu', 'hunt'],
  category: 'rpg',
  execute: async (denn, m) => {
    const user = getUser(m.sender);
    const now = Date.now();
    const cooldown = 60000; // 1 menit
    if (user.lastHunt && now - user.lastHunt < cooldown) {
      const sisa = Math.ceil((cooldown - (now - user.lastHunt)) / 1000);
      return m.reply(`⏳ Tunggu ${sisa} detik lagi sebelum berburu.`);
    }

    if ((user.health || 100) < 15) {
      return m.reply('❤️ HP kamu terlalu rendah. Ketik *.heal* dulu.');
    }

    const animals = [
      { name: 'Kelinci', money: [150, 400], xp: [8, 20] },
      { name: 'Ayam Hutan', money: [200, 500], xp: [10, 25] },
      { name: 'Rusa', money: [400, 900], xp: [15, 35] },
      { name: 'Babi Hutan', money: [500, 1200], xp: [20, 45] },
      { name: 'Kambing', money: [350, 800], xp: [12, 30] },
      { name: 'Sapi Liar', money: [700, 1500], xp: [25, 50] },
      { name: 'Harimau', money: [1200, 3000], xp: [40, 80] },
      { name: 'Beruang', money: [1500, 3500], xp: [50, 90] }
    ];

    const animal = animals[Math.floor(Math.random() * animals.length)];
    const moneyGain = animal.money[0] + Math.floor(Math.random() * (animal.money[1] - animal.money[0] + 1));
    const xpGain = animal.xp[0] + Math.floor(Math.random() * (animal.xp[1] - animal.xp[0] + 1));

    user.money = (user.money || 0) + moneyGain;
    user.health = Math.max(0, (user.health || 100) - (5 + Math.floor(Math.random() * 10)));
    user.lastHunt = now;
    saveUser(m.sender, user);

    const result = addXP(m.sender, xpGain);
    const updated = getUser(m.sender);

    let teks = `🏹 *BERBURU*\n\n`;
    teks += `Hasil: *${animal.name}*\n`;
    teks += `💰 Uang: +${formatMoney(moneyGain)}\n`;
    teks += `⭐ XP: +${xpGain}\n`;
    teks += `❤️ HP: ${updated.health}/100\n`;
    teks += `💵 Dompet: ${formatMoney(updated.money)}\n`;
    teks += `📊 Level: ${updated.level} | XP: ${updated.xp}/${updated.level * 100}`;

    if (result.levelsGained > 0) {
      teks += `\n\n🎉 *LEVEL UP!* Naik ${result.levelsGained} level → Level ${updated.level}`;
    }

    await m.reply(teks);
  }
};
