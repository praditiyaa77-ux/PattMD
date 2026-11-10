export default {
    command: ['suit'],
    category: 'fun',
    execute: async (denn, m, { prefix, text }) => {
        if (!text) return m.reply(`Pilih salah satu:\n➤ ${prefix}suit batu\n➤ ${prefix}suit gunting\n➤ ${prefix}suit kertas`)
        
        const userChoice = text.toLowerCase()
        const validChoices = ['batu', 'gunting', 'kertas']
        
        if (!validChoices.includes(userChoice)) {
            return m.reply(`❌ Pilihan tidak valid! Pilih *batu*, *gunting*, atau *kertas*.`)
        }

        const botChoice = validChoices[Math.floor(Math.random() * validChoices.length)]
        
        let result = ''
        if (userChoice === botChoice) {
            result = '🤝 *SERI!*'
        } else if (
            (userChoice === 'batu' && botChoice === 'gunting') ||
            (userChoice === 'gunting' && botChoice === 'kertas') ||
            (userChoice === 'kertas' && botChoice === 'batu')
        ) {
            result = '🎉 *KAMU MENANG!*'
        } else {
            result = '😭 *KAMU KALAH!*'
        }

        const txt = `✊✌️✋ *SUIT*\n\n` +
            `👤 *Kamu:* ${userChoice}\n` +
            `🤖 *Bot:* ${botChoice}\n\n` +
            `${result}`
            
        await m.reply(txt)
    }
};