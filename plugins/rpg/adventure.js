import { getUser, saveUser, addXP, formatMoney } from '../../lib/rpg.js';

export default {
  command: ['adventure', 'petualangan'],
  category: 'rpg',
  execute: async (denn, m) => {
    const user = getUser(m.sender);
    const now = Date.now();
    const cooldown = 90000;
    if (user.lastAdventure && now - user.lastAdventure < cooldown) {
      const sisa = Math.ceil((cooldown - (now - user.lastAdventure)) / 1000);
      return m.reply(`⏳ Tunggu ${sisa} detik lagi sebelum adventure.`);
    }
    if ((user.health || 100) < 20) {
      return m.reply('❤️ HP terlalu rendah. Ketik *.heal* dulu.');
    }

    const events = [
      { text: 'Menemukan harta karun!', money: [800, 2000], xp: [40, 80], hp: -5 },
      { text: 'Bertemu monster dan berhasil kabur', money: [200, 600], xp: [20, 45], hp: -15 },
      { text: 'Menemukan desa damai', money: [400, 1000], xp: [25, 50], hp: 10 },
      { text: 'Tersesat di hutan', money: [100, 400], xp: [15, 35], hp: -10 },
      { text: 'Menemukan artefak kuno', money: [1000, 3000], xp: [50, 100], hp: -8 },
      { text: 'Membantu pedagang dan diberi tip', money: [500, 1200], xp: [30, 60], hp: 0 }
    ];

    const ev = events[Math.floor(Math.random() * events.length)];
    const moneyGain = ev.money[0] + Math.floor(Math.random() * (ev.money[1] - ev.money[0] + 1));
    const xpGain = ev.xp[0] + Math.floor(Math.random() * (ev.xp[1] - ev.xp[0] + 1));

    user.money = (user.money || 0) + moneyGain;
    user.health = Math.min(100, Math.max(0, (user.health || 100) + ev.hp));
    user.lastAdventure = now;
    saveUser(m.sender, user);

    const result = addXP(m.sender, xpGain);
    const updated = getUser(m.sender);

    let teks = `🗺️ *ADVENTURE*\n\n`;
    teks += `${ev.text}\n\n`;
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
