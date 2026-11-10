import { getUser, saveUser, addXP, formatMoney } from '../../lib/rpg.js';

export default {
  command: ['farm', 'bertani', 'kebun'],
  category: 'rpg',
  execute: async (denn, m) => {
    const user = getUser(m.sender);
    const now = Date.now();
    const cooldown = 60000;
    if (user.lastFarm && now - user.lastFarm < cooldown) {
      const sisa = Math.ceil((cooldown - (now - user.lastFarm)) / 1000);
      return m.reply(`⏳ Tunggu ${sisa} detik lagi.`);
    }

    const crops = [
      { name: 'Padi', money: [150, 400], xp: [8, 18] },
      { name: 'Jagung', money: [180, 450], xp: [10, 22] },
      { name: 'Tomat', money: [120, 350], xp: [7, 16] },
      { name: 'Cabai', money: [200, 550], xp: [12, 28] },
      { name: 'Wortel', money: [160, 400], xp: [9, 20] },
      { name: 'Kentang', money: [170, 420], xp: [10, 24] }
    ];

    const crop = crops[Math.floor(Math.random() * crops.length)];
    const moneyGain = crop.money[0] + Math.floor(Math.random() * (crop.money[1] - crop.money[0] + 1));
    const xpGain = crop.xp[0] + Math.floor(Math.random() * (crop.xp[1] - crop.xp[0] + 1));

    user.money = (user.money || 0) + moneyGain;
    user.lastFarm = now;
    saveUser(m.sender, user);

    const result = addXP(m.sender, xpGain);
    const updated = getUser(m.sender);

    let teks = `🌾 *BERTANI*\n\n`;
    teks += `Panen: *${crop.name}*\n`;
    teks += `💰 Uang: +${formatMoney(moneyGain)}\n`;
    teks += `⭐ XP: +${xpGain}\n`;
    teks += `💵 Dompet: ${formatMoney(updated.money)}\n`;
    teks += `📊 Level: ${updated.level} | XP: ${updated.xp}/${updated.level * 100}`;
    if (result.levelsGained > 0) {
      teks += `\n\n🎉 *LEVEL UP!* → Level ${updated.level}`;
    }
    await m.reply(teks);
  }
};
