import { getUser, saveUser, addXP, formatMoney } from '../../lib/rpg.js';

export default {
  command: ['bonus'],
  category: 'rpg',
  execute: async (denn, m) => {
    const user = getUser(m.sender);
    const now = Date.now();
    const key = 'lastBonus';
    const cooldown = 40000;
    if (user[key] && now - user[key] < cooldown) {
      const sisa = Math.ceil((cooldown - (now - user[key])) / 1000);
      return m.reply(`⏳ Tunggu ${sisa} detik lagi.`);
    }

    const moneyGain = 100 + Math.floor(Math.random() * 900);
    const xpGain = 10 + Math.floor(Math.random() * 40);

    user.money = (user.money || 0) + moneyGain;
    user[key] = now;
    saveUser(m.sender, user);

    const result = addXP(m.sender, xpGain);
    const updated = getUser(m.sender);

    let teks = `🎮 *BONUS*\n\n`;
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
