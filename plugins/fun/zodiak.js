export default {
  command: ['zodiak','zodiac'],
  category: 'fun',
  execute: async (denn, m, { text, prefix }) => {
    const z = {
      aries:'21 Mar - 19 Apr', taurus:'20 Apr - 20 Mei', gemini:'21 Mei - 20 Jun',
      cancer:'21 Jun - 22 Jul', leo:'23 Jul - 22 Agu', virgo:'23 Agu - 22 Sep',
      libra:'23 Sep - 22 Okt', scorpio:'23 Okt - 21 Nov', sagitarius:'22 Nov - 21 Des',
      capricorn:'22 Des - 19 Jan', aquarius:'20 Jan - 18 Feb', pisces:'19 Feb - 20 Mar'
    };
    if (!text) return m.reply(`Contoh: ${prefix}zodiak leo\n\nPilihan: ${Object.keys(z).join(', ')}`);
    const key = text.toLowerCase();
    if (z[key]) await m.reply(`♈ *${key.toUpperCase()}*\n\nTanggal: ${z[key]}\n\n_Ramalan detail butuh API._`);
    else await m.reply('Zodiak tidak dikenal');
  }
};
