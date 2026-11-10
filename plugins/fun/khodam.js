export default {
    command: ['khodam', 'cek-khodam'],
    category: 'fun',
    execute: async (denn, m, { prefix }) => {
        let target = m.mentionedJid?.[0] || m.quoted?.sender || m.sender
        let nama = target.split('@')[0]
        
        if (target === m.sender) {
            nama = m.pushName || nama
        }

        const khodams = [
            "Macan Putih", "Naga Emas", "Kuntilanak", "Pocong", 
            "Genderuwo", "Siluman Ular", "Harimau Hitam", "Babi Ngepet", 
            "Tuyul", "Jenglot", "Kaleng Kerupuk", "Kipas Angin Cosmos",
            "Sendal Jepit", "Bantal Guling", "Sapu Lidi", "Kosong (Aura Lemah)"
        ]
        
        const random = khodams[Math.floor(Math.random() * khodams.length)]
        const aura = Math.floor(Math.random() * 100) + 1
        
        const txt = `🔮 *CEK KHODAM* 🔮\n\n` +
            `👤 *Nama:* @${nama}\n` +
            `👻 *Khodam:* *${random}*\n` +
            `✨ *Tingkat Aura:* ${aura}%\n\n` +
            `_Awas, khodamnya bisa keluar kapan saja!_`
            
        await denn.sendMessage(m.chat, { text: txt, mentions: [target] }, { quoted: m })
    }
};