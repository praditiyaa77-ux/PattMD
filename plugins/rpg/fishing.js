import { getUser, saveUser, addXP, formatMoney } from '../../lib/rpg.js';

export default {
  command: ['pancingikan'],
  category: 'rpg',
  execute: async (denn, m) => {
    const user = getUser(m.sender);
    const now = Date.now();
    const cooldown = 50000;
    if (user.lastFishing && now - user.lastFishing < cooldown) {
      const sisa = Math.ceil((cooldown - (now - user.lastFishing)) / 1000);
      return m.reply(`⏳ Tunggu ${sisa} detik lagi sebelum memancing.`);
    }

    const fishes = [
      { name: 'Lele', money: [100, 350], xp: [5, 15] },
      { name: 'Nila', money: [150, 450], xp: [8, 20] },
      { name: 'Gurame', money: [250, 700], xp: [12, 28] },
      { name: 'Kakap', money: [400, 1000], xp: [18, 40] },
      { name: 'Hiu', money: [1000, 2500], xp: [40, 80] },
      { name: 'Paus', money: [2000, 5000], xp: [60, 120] },
      { name: 'Sepatu Bekas', money: [50, 150], xp: [3, 10] }
    ];

    const fish = fishes[Math.floor(Math.random() * fishes.length)];
    const moneyGain = fish.money[0] + Math.floor(Math.random() * (fish.money[1] - fish.money[0] + 1));
    const xpGain = fish.xp[0] + Math.floor(Math.random() * (fish.xp[1] - fish.xp[0] + 1));

    user.money = (user.money || 0) + moneyGain;
    user.lastFishing = now;
    saveUser(m.sender, user);

    const result = addXP(m.sender, xpGain);
    const updated = getUser(m.sender);

    let teks = `🎣 *FISHING*\n\n`;
    teks += `Hasil: *${fish.name}*\n`;
    teks += `💰 Uang: +${formatMoney(moneyGain)}\n`;
    teks += `⭐ XP: +${xpGain}\n`;
    teks += `💵 Dompet: ${formatMoney(updated.money)}\n`;
    teks += `📊 Level: ${updated.level} | XP: ${updated.xp}/${updated.level * 100}`;
    if (result.levelsGained > 0) {
      teks += `\n\n🎉 *LEVEL UP!* Naik ${result.levelsGained} level → Level ${updated.level}`;
    }
    await m.reply(teks);
  }
};
