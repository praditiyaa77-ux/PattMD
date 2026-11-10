export default {
  command: ['ayat', 'randomayat'],
  category: 'islamic',
  execute: async (denn, m) => {
    const ayat = [
      { surah: 'Al-Fatihah', ayat: 1, arab: 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ', arti: 'Dengan nama Allah Yang Maha Pengasih, Maha Penyayang.' },
      { surah: 'Al-Ikhlas', ayat: 1, arab: 'قُلْ هُوَ اللّٰهُ اَحَدٌ', arti: 'Katakanlah: Dia-lah Allah, Yang Maha Esa.' },
      { surah: 'Al-Baqarah', ayat: 255, arab: 'اللّٰهُ لَا إِلٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ', arti: 'Allah, tidak ada Tuhan selain Dia. Yang Maha Hidup, Yang terus-menerus mengurus (makhluk-Nya).' },
      { surah: 'Ar-Rahman', ayat: 13, arab: 'فَبِاَيِّ اٰلَاءِ رَبِّكُمَا تُكَذِّبٰنِ', arti: 'Maka nikmat Tuhanmu yang manakah yang kamu dustakan?' }
    ];
    const a = ayat[Math.floor(Math.random()*ayat.length)];
    await m.reply(`📖 *${a.surah}:${a.ayat}*\n\n${a.arab}\n\nArtinya: ${a.arti}`);
  }
};
