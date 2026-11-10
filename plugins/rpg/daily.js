import { getUser, saveUser, addXP, formatMoney } from '../../lib/rpg.js';

const DAY = 86400000;

export default {
  command: ['daily'],
  category: 'rpg',
  execute: async (denn, m) => {
    const user = getUser(m.sender);
    const now = Date.now();
    const elapsed = now - (user.lastDaily || 0);
    if (elapsed < DAY) {
      const left = DAY - elapsed;
      const hours = Math.floor(left / 3600000);
      const minutes = Math.floor((left % 3600000) / 60000);
      return m.reply(`⏳ Daily sudah diklaim.\nKembali dalam *${hours} jam ${minutes} menit*.`);
    }

    user.dailyStreak = elapsed < DAY * 2 ? (user.dailyStreak || 0) + 1 : 1;
    const reward = 5000 + Math.min(user.dailyStreak - 1, 7) * 500;
    const xpGain = 50 + Math.min(user.dailyStreak - 1, 7) * 10;

    user.money = (user.money || 0) + reward;
    user.limit = (user.limit || 0) + 10;
    user.lastDaily = now;
    saveUser(m.sender, user);

    const result = addXP(m.sender, xpGain);
    const updated = getUser(m.sender);

    let teks = `🎁 *DAILY REWARD*\n\n`;
    teks += `💰 Uang: +${formatMoney(reward)}\n`;
    teks += `⭐ XP: +${xpGain}\n`;
    teks += `🎟️ Limit: +10\n`;
    teks += `🔥 Streak: ${user.dailyStreak} hari\n`;
    teks += `💵 Dompet: ${formatMoney(updated.money)}\n`;
    teks += `📊 Level: ${updated.level} | XP: ${updated.xp}/${updated.level * 100}`;
    if (result.levelsGained > 0) {
      teks += `\n\n🎉 *LEVEL UP!* → Level ${updated.level}`;
    }
    await m.reply(teks);
  }
};
