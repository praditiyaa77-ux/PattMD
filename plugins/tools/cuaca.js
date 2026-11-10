export default {
  command: ['cuaca', 'weather'],
  category: 'tools',
  execute: async (denn, m, { text, prefix }) => {
    if (!text) return m.reply(`Contoh: ${prefix}cuaca jakarta`);
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
      if (!c) return m.reply('❌ Lokasi tidak ditemukan. Coba nama kota lain.');

      const nama = area?.areaName?.[0]?.value || text;
      const region = area?.region?.[0]?.value || '';
      const country = area?.country?.[0]?.value || '';

      let out = `🌤️ *Cuaca ${nama}*\n`;
      if (region || country) out += `${region}${region && country ? ', ' : ''}${country}\n\n`;
      out += `🌡️ Suhu: *${c.temp_C}°C* (terasa ${c.FeelsLikeC}°C)\n`;
      out += `☁️ Kondisi: ${c.weatherDesc?.[0]?.value || '-'}\n`;
      out += `💧 Kelembaban: ${c.humidity}%\n`;
      out += `💨 Angin: ${c.windspeedKmph} km/h ${c.winddir16Point || ''}\n`;
      out += `👁️ Jarak pandang: ${c.visibility} km\n`;
      out += `🌧️ Curah hujan: ${c.precipMM} mm\n`;

      const days = (data.weather || []).slice(0, 3);
      if (days.length) {
        out += `\n📅 *Prakiraan 3 hari:*\n`;
        days.forEach(d => {
          const desc = d.hourly?.[4]?.weatherDesc?.[0]?.value || d.hourly?.[0]?.weatherDesc?.[0]?.value || '-';
          out += `• ${d.date}: ${d.avgtempC}°C (max ${d.maxtempC}° / min ${d.mintempC}°) — ${desc}\n`;
        });
      }
      await m.reply(out);
    } catch (e) {
      await m.reply(`❌ Gagal ambil cuaca: ${e.message}`);
    }
  }
};
