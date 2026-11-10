export default {
    command: ['pushkontak', 'jpm'],
    category: 'owner',
    execute: async (denn, m, { prefix, command, text, isOwner, botNumber }) => {
        if (!isOwner) return m.reply(global.msg.owner)
        if (!m.isGroup) return m.reply(global.msg.group)
        if (!text) return m.reply(`Format: *${prefix + command} <teks pesan>*`)
        await m.reply(`⏳ Memulai push kontak...`)
        try {
          const metadata = await denn.groupMetadata(m.chat)
          const members = metadata.participants.map(v => v.id)
          let count = 0
          for (let jid of members) {
            if (jid === botNumber) continue
            await denn.sendMessage(jid, { text: text })
            count++
            await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 3000) + 4000)) 
          }
          m.reply(`✅ Berhasil mengirim pesan ke ${count} member.`)
        } catch (e) { m.reply(`❌ Gagal: ${e.message}`) }
    }
};