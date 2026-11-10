const quotes = ["Kesuksesan adalah hasil dari persiapan, kerja keras, dan belajar dari kegagalan. - Colin Powell","Jangan takut gagal, takutlah tidak mencoba.","Hidup ini singkat, jangan buang waktu untuk orang yang tidak menghargaimu.","Setiap hari adalah kesempatan baru untuk menjadi lebih baik.","Keberanian bukanlah tidak adanya rasa takut, tapi menghadapinya.","Belajarlah dari masa lalu, hiduplah untuk masa kini, dan rencanakan masa depan.","Orang sukses adalah mereka yang bangkit setelah jatuh.","Kesabaran adalah kunci menuju kesuksesan.","Jadilah perubahan yang ingin kamu lihat di dunia. - Gandhi","Mimpi besar dan berani gagal. - Norman Vaughan"];
export default {
  command: ['quote', 'quotes', 'kata'],
  category: 'fun',
  execute: async (denn, m) => {
    const q = quotes[Math.floor(Math.random()*quotes.length)];
    await m.reply(`💬 *QUOTE*\n\n"${q}"`);
  }
};