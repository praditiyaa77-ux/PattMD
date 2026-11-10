export default {
  command: ['hadist','hadits'],
  category: 'islamic',
  execute: async (denn, m) => {
    const list = [
      'Sesungguhnya amal itu tergantung niatnya. (Bukhari-Muslim)',
      'Muslim yang baik adalah yang selamat muslim lainnya dari lisan dan tangannya. (Bukhari-Muslim)',
      'Senyummu kepada saudaramu adalah sedekah. (Tirmidzi)',
      'Barangsiapa beriman kepada Allah dan hari akhir, hendaklah ia berkata baik atau diam. (Bukhari-Muslim)'
    ];
    await m.reply(`📜 *HADIST*\n\n${list[Math.floor(Math.random()*list.length)]}`);
  }
};
