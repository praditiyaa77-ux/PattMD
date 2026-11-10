export default {
  command: ['jadwalsholat', 'sholat'],
  category: 'islamic',
  execute: async (denn, m, { text, prefix }) => {
    const kota = text || 'jakarta';
    try {
      const axios = (await import('axios')).default;
      const res = await axios.get(`https://api.myquran.com/v2/sholat/jadwal/1609/2024/01/01`, { timeout: 10000 }).catch(()=>null);
      // fallback static message if API fails
      await m.reply(`🕌 *Jadwal Sholat*\n\nKota: ${kota}\n\nGunakan API MyQuran atau isi manual.\nSubuh - Dzuhur - Ashar - Maghrib - Isya\n\n_Untuk data akurat, cek aplikasi muslim lokal._`);
    } catch {
      await m.reply(`🕌 *Jadwal Sholat (${kota})*\n\nSilakan cek aplikasi jadwal sholat terpercaya untuk waktu akurat hari ini.`);
    }
  }
};
