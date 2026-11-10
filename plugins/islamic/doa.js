const doas = ["Doa sebelum makan: Allahumma barik lana fima razaqtana wa qina adzabannar","Doa sesudah makan: Alhamdulillahilladzi ath'amana wa saqana wa ja'alana muslimin","Doa masuk toilet: Allahumma inni a'udzu bika minal khubutsi wal khabaits","Doa keluar toilet: Ghufranak","Doa naik kendaraan: Subhanalladzi sakhkhara lana hadza wa ma kunna lahu muqrinin","Doa masuk rumah: Bismillahi walajna wa bismillahi kharajna wa 'ala rabbina tawakkalna","Doa keluar rumah: Bismillahi tawakkaltu 'alallah, la hawla wa la quwwata illa billah","Doa sebelum tidur: Bismika Allahumma ahya wa bismika amut","Doa bangun tidur: Alhamdulillahilladzi ahyana ba'da ma amatana wa ilaihin nushur"];
export default {
  command: ['doa'],
  category: 'islamic',
  execute: async (denn, m) => {
    await m.reply(`🙏 *Doa Harian*\n\n${doas[Math.floor(Math.random()*doas.length)]}`);
  }
};