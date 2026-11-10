const jokes = ["Kenapa ayam menyeberang jalan? Karena mau ke seberang!","Apa bedanya kamu sama wifi? Wifi masih ada yang nyari.","Kenapa komputer dingin? Karena windows-nya terbuka.","Apa yang lebih bodoh dari bodoh? Bodoh banget.","Dokter: Anda butuh kacamata. Pasien: Saya sudah pakai kacamata. Dokter: Ya, jadi butuh yang bagus.","Kenapa hantu tidak pernah bohong? Karena dia selalu jujur (transparent).","Apa makanan favorit ninja? Kung-fu-tiao.","Kenapa buku matematika sedih? Karena penuh masalah.","Apa yang dikatakan 0 ke 8? Nice belt!","Kenapa ikan tidak bisa main basket? Karena takut di-net."];
export default {
  command: ['joke', 'jokes', 'candaan'],
  category: 'fun',
  execute: async (denn, m) => {
    const j = jokes[Math.floor(Math.random()*jokes.length)];
    await m.reply(`😂 *JOKE*\n\n${j}`);
  }
};