const niatList = [
    {
        nama: 'Subuh',
        arab: `اُصَلِّى فَرْضَ الصُّبْحِ رَكْعَتَيْنِ مُسْتَقْبِلَ الْقِبْلَةِ اَدَاءً لِلّٰهِ تَعَالَى`,
        latin: `Ushallii fardhash-shubhi rak'ataini mustaqbilal qiblati adaa-an lillaahi ta'aalaa`,
        arti: `Aku niat melakukan sholat fardhu Subuh 2 rakaat, sambil menghadap qiblat, saat ini, karena Allah ta'ala.`
    },
    {
        nama: 'Dzuhur',
        arab: `اُصَلِّى فَرْضَ الظُّهْرِ اَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ اَدَاءً لِلّٰهِ تَعَالَى`,
        latin: `Ushallii fardhazh-zhuhri arba'a raka'aatin mustaqbilal qiblati adaa-an lillaahi ta'aalaa`,
        arti: `Aku niat melakukan sholat fardhu Dzuhur 4 rakaat, sambil menghadap qiblat, saat ini, karena Allah ta'ala.`
    },
    {
        nama: 'Ashar',
        arab: `اُصَلِّى فَرْضَ الْعَصْرِ اَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ اَدَاءً لِلّٰهِ تَعَالَى`,
        latin: `Ushallii fardhal-'ashri arba'a raka'aatin mustaqbilal qiblati adaa-an lillaahi ta'aalaa`,
        arti: `Aku niat melakukan sholat fardhu Ashar 4 rakaat, sambil menghadap qiblat, saat ini, karena Allah ta'ala.`
    },
    {
        nama: 'Maghrib',
        arab: `اُصَلِّى فَرْضَ الْمَغْرِبِ ثَلَاثَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ اَدَاءً لِلّٰهِ تَعَالَى`,
        latin: `Ushallii fardhal-maghribi tsalaatsa raka'aatin mustaqbilal qiblati adaa-an lillaahi ta'aalaa`,
        arti: `Aku niat melakukan sholat fardhu Maghrib 3 rakaat, sambil menghadap qiblat, saat ini, karena Allah ta'ala.`
    },
    {
        nama: 'Isya',
        arab: `اُصَلِّى فَرْضَ الْعِشَاءِ اَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ اَدَاءً لِلّٰهِ تَعَالَى`,
        latin: `Ushallii fardhal-'isyaa-i arba'a raka'aatin mustaqbilal qiblati adaa-an lillaahi ta'aalaa`,
        arti: `Aku niat melakukan sholat fardhu Isya 4 rakaat, sambil menghadap qiblat, saat ini, karena Allah ta'ala.`
    }
];

export default {
    command: ['niatsholat', 'niat'],
    category: 'islamic',
    execute: async (denn, m, { text, prefix }) => {
        if (!text) {
            let list = `🕌 *DAFTAR NIAT SHOLAT*\n\n`;
            niatList.forEach((n, i) => list += `${i + 1}. Sholat ${n.nama}\n`);
            list += `\nKetik: \`${prefix}niatsholat <nama>\`\nContoh: \`${prefix}niatsholat subuh\``;
            return m.reply(list);
        }

        const key = text.toLowerCase().trim();
        const found = niatList.find(n => n.nama.toLowerCase() === key);

        if (!found) {
            return m.reply(`❌ Niat sholat *${text}* tidak ditemukan.\nPilihan: ${niatList.map(n => n.nama.toLowerCase()).join(', ')}`);
        }

        const caption = `🕌 *NIAT SHOLAT ${found.nama.toUpperCase()}*\n\n` +
            `📜 *Arab:*\n${found.arab}\n\n` +
            `🔤 *Latin:*\n_${found.latin}_\n\n` +
            `📖 *Arti:*\n${found.arti}`;

        await m.reply(caption);
    }
};