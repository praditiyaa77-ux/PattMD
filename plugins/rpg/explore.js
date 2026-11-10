import { getUser, saveUser, addXP, formatMoney } from '../../lib/rpg.js';

const cooldown = 10 * 60 * 1000;
const places = [
  { name: 'Hutan Pinus', money: [500, 1800], xp: [12, 25], item: 'batu' },
  { name: 'Tepi Sungai', money: [300, 1200], xp: [10, 22], item: 'ikan_lele' },
  { name: 'Pasar Lama', money: [700, 2200], xp: [15, 28], item: 'sepatu_bekas' },
  { name: 'Pantai Selatan', money: [900, 2600], xp: [18, 32], item: 'ikan_hiu' }
];

const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export default {
  command: ['explore', 'jelajah'],
  category: 'rpg',
  execute: async (denn, m) => {
    const user = getUser(m.sender);
    const now = Date.now();
    const remaining = cooldown - (now - (user.lastExplore || 0));
    if (remaining > 0) return m.reply(`🧭 Kamu masih beristirahat. Coba lagi dalam ${Math.ceil(remaining / 60000)} menit.`);
    if (user.health < 20) return m.reply('❤️ HP minimal 20 untuk menjelajah. Pulihkan HP terlebih dahulu.');

    const place = places[Math.floor(Math.random() * places.length)];
    const money = randomBetween(...place.money);
    const xp = randomBetween(...place.xp);
    const foundItem = Math.random() < 0.35;
    user.money += money;
    user.lastExplore = now;
    user.health = Math.max(0, user.health - randomBetween(2, 8));
    if (foundItem) user.inventory[place.item] = (user.inventory[place.item] || 0) + 1;
    saveUser(m.sender, user);
    const result = addXP(m.sender, xp);
    return m.reply(`🧭 *JELAJAH BERHASIL*\\n\\nLokasi: *${place.name}*\\n💰 Uang: +${formatMoney(money)}\\n✨ XP: +${xp}\\n${foundItem ? `🎒 Item: +1 ${place.item}` : '🎒 Tidak menemukan item'}\\n❤️ HP tersisa: ${result.health}/100${result.levelsGained ? `\\n🎉 Naik ${result.levelsGained} level!` : ''}`);
  }
};
