// Alias cuaca juga di search biar mudah ketemu
export default {
  command: ['infocuaca'],
  category: 'search',
  execute: async (denn, m, { text, prefix }) => {
    if (!text) return m.reply(`Contoh: ${prefix}infocuaca jakarta`);
    await m.reply(global.msg?.wait || '⏳ Cek cuaca...');

    try {
      const res = await fetch(
        `https://wttr.in/${encodeURIComponent(text)}?format=j1`,
        {
          headers: { 'User-Agent': 'BotESM/2.1' },
          signal: AbortSignal.timeout(12000)
        }
      );
      const data = await res.json();
      const c = data.current_condition?.[0];
      const area = data.nearest_area?.[0];
      if (!c) return m.reply('❌ Lokasi tidak ditemukan.');

      const nama = area?.areaName?.[0]?.value || text;
      const region = area?.region?.[0]?.value || '';
      const country = area?.country?.[0]?.value || '';

      let out = `🌤️ *Cuaca ${nama}*\n`;
      if (region || country) out += `${region}${region && country ? ', ' : ''}${country}\n\n`;
      out += `🌡️ Suhu: *${c.temp_C}°C* (terasa ${c.FeelsLikeC}°C)\n`;
      out += `☁️ Kondisi: ${c.weatherDesc?.[0]?.value || '-'}\n`;
      out += `💧 Kelembaban: ${c.humidity}%\n`;
      out += `💨 Angin: ${c.windspeedKmph} km/h\n`;
      out += `👁️ Jarak pandang: ${c.visibility} km\n`;

      // Forecast singkat
      const days = (data.weather || []).slice(0, 3);
      if (days.length) {
        out += `\n📅 *Prakiraan:*\n`;
        days.forEach(d => {
          out += `• ${d.date}: ${d.avgtempC}°C (${d.maxtempC}/${d.mintempC}) - ${d.hourly?.[4]?.weatherDesc?.[0]?.value || '-'}\n`;
        });
      }
      await m.reply(out);
    } catch (e) {
      await m.reply(`❌ Gagal ambil cuaca: ${e.message}`);
    }
  }
};
