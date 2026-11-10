import { getUser, saveUser, addXP, formatMoney } from '../../lib/rpg.js';

export default {
  command: ['absen', 'hadir'],
  category: 'rpg',
  execute: async (denn, m) => {
    const user = getUser(m.sender);
    const now = Date.now();
    if (user.lastAbsen && now - user.lastAbsen < 86400000) {
      return m.reply('⏰ Kamu sudah absen hari ini. Coba lagi besok!');
    }

    const reward = 1000 + Math.floor(Math.random() * 2000);
    const xpGain = 20 + Math.floor(Math.random() * 30);

    user.money = (user.money || 0) + reward;
    user.lastAbsen = now;
    saveUser(m.sender, user);

    const result = addXP(m.sender, xpGain);
    const updated = getUser(m.sender);

    let teks = `✅ *ABSEN BERHASIL*\n\n`;
    teks += `💰 Uang: +${formatMoney(reward)}\n`;
    teks += `⭐ XP: +${xpGain}\n`;
    teks += `💵 Dompet: ${formatMoney(updated.money)}\n`;
    teks += `📊 Level: ${updated.level} | XP: ${updated.xp}/${updated.level * 100}`;
    if (result.levelsGained > 0) {
      teks += `\n\n🎉 *LEVEL UP!* → Level ${updated.level}`;
    }
    await m.reply(teks);
  }
};
