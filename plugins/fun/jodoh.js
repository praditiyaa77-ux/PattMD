export default {
    command: ['jodoh', 'match'],
    category: 'fun',
    execute: async (denn, m, { prefix }) => {
        let target = m.mentionedJid?.[0] || m.quoted?.sender || null
        
        if (!target) {
            return m.reply(`Tag orang yang mau dicek jodohnya!\nContoh: ${prefix}jodoh @teman`)
        }
        if (target === m.sender) {
            return m.reply('❌ Kamu tidak bisa mengecek jodoh dengan dirimu sendiri!')
        }

        const name1 = m.pushName || m.sender.split('@')[0]
        const name2 = target.split('@')[0]

        // Angka random 1-100
        const persentase = Math.floor(Math.random() * 100) + 1
        
        let status = ''
        if (persentase > 80) status = '💍 *JODOH SEPADAN!* Cepat nikahin!'
        else if (persentase > 60) status = '💖 *COCOK BANGET!* Lanjutkan ke pelaminan.'
        else if (persentase > 40) status = '🤔 *LUMYAN.* Bisa dipertimbangkan.'
        else if (persentase > 20) status = '😬 *HMMM.* Mending temenan aja deh.'
        else status = '💔 *TIDAK COCOK.* Jangan dipaksa, sakit hati nanti.'

        const txt = `💘 *CEK JODOH* 💘\n\n` +
            `👤 *Kamu:* ${name1}\n` +
            `💕 *Target:* @${name2}\n\n` +
            `📊 *Kecocokan:* ${persentase}%\n` +
            `${status}`
            
        await denn.sendMessage(m.chat, { text: txt, mentions: [target] }, { quoted: m })
    }
};