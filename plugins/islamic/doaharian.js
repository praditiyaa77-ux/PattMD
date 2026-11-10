const doaList = [
    {
        nama: 'Sebelum Tidur',
        arab: `بِسْمِكَ اللّٰهُمَّ اَحْيَا وَاَمُوْتُ`,
        latin: `Bismikallaahumma ahyaa wa amuutu`,
        arti: `Dengan menyebut nama-Mu ya Allah, aku hidup dan aku mati.`
    },
    {
        nama: 'Bangun Tidur',
        arab: `اَلْحَمْدُ لِلّٰهِ الَّذِيْ اَحْيَانَا بَعْدَ مَا اَمَاتَنَا وَاِلَيْهِ النُّشُوْرُ`,
        latin: `Alhamdulillaahil-ladzii ahyaanaa ba'da maa amaatanaa wa ilaihin-nusyuur`,
        arti: `Segala puji bagi Allah yang telah menghidupkan kami setelah mematikan kami, dan kepada-Nya kami dibangkitkan.`
    },
    {
        nama: 'Sebelum Makan',
        arab: `بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ`,
        latin: `Bismillaahir-rahmaanir-rahiim`,
        arti: `Dengan menyebut nama Allah Yang Maha Pengasih lagi Maha Penyayang.`
    },
    {
        nama: 'Setelah Makan',
        arab: `اَلْحَمْدُ لِلّٰهِ الَّذِيْ اَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِيْنَ`,
        latin: `Alhamdulillaahil-ladzii ath'amanaa wa saqaanaa wa ja'alanaa muslimiin`,
        arti: `Segala puji bagi Allah yang telah memberi kami makan dan minum, serta menjadikan kami sebagai orang muslim.`
    },
    {
        nama: 'Masuk WC',
        arab: `اَللّٰهُمَّ اِنِّيْ اَعُوْذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ`,
        latin: `Allaahumma innii a'uudzu bika minal khubutsi wal khabaa-its`,
        arti: `Ya Allah, aku berlindung kepada-Mu dari setan laki-laki dan setan perempuan.`
    },
    {
        nama: 'Keluar WC',
        arab: `غُفْرَانَكَ`,
        latin: `Ghufraanaka`,
        arti: `Aku memohon ampunan-Mu (ya Allah).`
    },
    {
        nama: 'Keluar Rumah',
        arab: `بِسْمِ اللّٰهِ تَوَكَّلْتُ عَلَى اللّٰهِ لَا حَوْلَ وَلَا قُوَّةَ اِلَّا بِاللّٰهِ`,
        latin: `Bismillaahi tawakkaltu 'alallaahi laa haula wa laa quwwata illaa billaah`,
        arti: `Dengan menyebut nama Allah, aku bertawakal kepada Allah, tiada daya dan kekuatan kecuali dengan pertolongan Allah.`
    },
    {
        nama: 'Masuk Rumah',
        arab: `بِسْمِ اللّٰهِ وَلَجْنَا وَبِسْمِ اللّٰهِ خَرَجْنَا وَعَلَى اللّٰهِ رَبِّنَا تَوَكَّلْنَا`,
        latin: `Bismillaahi walajnaa wa bismillaahi kharajnaa wa 'alallaahi rabbinaa tawakkalnaa`,
        arti: `Dengan nama Allah kami masuk, dengan nama Allah kami keluar, dan kepada Allah Tuhan kami, kami bertawakal.`
    },
    {
        nama: 'Naik Kendaraan',
        arab: `سُبْحَانَ الَّذِيْ سَخَّرَ لَنَا هٰذَا وَمَا كُنَّا لَهُ مُقْرِنِيْنَ وَاِنَّا اِلَى رَبِّنَا لَمُنْقَلِبُوْنَ`,
        latin: `Subhaanal-ladzii sakhkhara lanaa haadzaa wa maa kunnaa lahu muqriniin, wa innaa ilaa rabbinaa lamunqalibuun`,
        arti: `Maha Suci Allah yang telah menundukkan kendaraan ini bagi kami, padahal kami sebelumnya tidak mampu menguasainya. Dan sesungguhnya kepada Tuhan kami, kami akan kembali.`
    },
    {
        nama: 'Menuntut Ilmu',
        arab: `رَبِّ زِدْنِيْ عِلْمًا وَارْزُقْنِيْ فَهْمًا`,
        latin: `Rabbi zidnii 'ilmaa warzuqnii fahmaa`,
        arti: `Ya Tuhanku, tambahkanlah ilmu kepadaku dan berilah aku pemahaman.`
    },
    {
        nama: 'Untuk Orang Tua',
        arab: `رَبِّ اغْفِرْ لِيْ وَلِوَالِدَيَّ وَارْحَمْهُمَا كَمَا رَبَّيَانِيْ صَغِيْرًا`,
        latin: `Rabbigfir lii wa liwaalidayya warhamhumaa kamaa rabbayaanii shaghiiraa`,
        arti: `Ya Tuhanku, ampunilah aku dan kedua orang tuaku, dan sayangilah mereka sebagaimana mereka menyayangiku di waktu kecil.`
    },
    {
        nama: 'Kebaikan Dunia & Akhirat',
        arab: `رَبَّنَا اٰتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْاٰخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ`,
        latin: `Rabbanaa aatinaa fid-dunyaa hasanah wa fil aakhirati hasanah wa qinaa 'adzaaban-naar`,
        arti: `Wahai Tuhan kami, berikanlah kepada kami kebaikan di dunia dan kebaikan di akhirat, dan peliharalah kami dari azab neraka.`
    }
];

export default {
    command: ['doaharian', 'doa'],
    category: 'islamic',
    execute: async (denn, m, { text, prefix }) => {
        if (!text) {
            const d = doaList[Math.floor(Math.random() * doaList.length)];
            const caption = `🤲 *DOA HARIAN: ${d.nama.toUpperCase()}*\n\n` +
                `📜 *Arab:*\n${d.arab}\n\n` +
                `🔤 *Latin:*\n_${d.latin}_\n\n` +
                `📖 *Arti:*\n${d.arti}`;
            return m.reply(caption);
        }

        const key = text.toLowerCase().trim();
        const found = doaList.find(d => d.nama.toLowerCase().includes(key));

        if (!found) {
            let list = `🤲 *DAFTAR DOA HARIAN*\n\n`;
            doaList.forEach((d, i) => list += `${i + 1}. ${d.nama}\n`);
            list += `\nKetik: \`${prefix}doaharian <kata kunci>\`\nContoh: \`${prefix}doaharian tidur\``;
            return m.reply(`❌ Doa tidak ditemukan.\n\n${list}`);
        }

        const caption = `🤲 *DOA ${found.nama.toUpperCase()}*\n\n` +
            `📜 *Arab:*\n${found.arab}\n\n` +
            `🔤 *Latin:*\n_${found.latin}_\n\n` +
            `📖 *Arti:*\n${found.arti}`;

        await m.reply(caption);
    }
};