import axios from 'axios'

export default {
    command: ['cadmin', 'createadmin'],
    category: 'panel',
    execute: async (denn, m, { prefix, command, text, isOwner }) => {
        if (!isOwner) return m.reply(global.msg.owner)
        const argsAdmin = text.split(' ')
        if (argsAdmin.length < 2) return m.reply(`Format: *${prefix + command} <username> <nomorwa>*\nContoh: ${prefix + command} adminbudi 628123456789`)
        
        const username = argsAdmin[0].toLowerCase()
        let nomor = argsAdmin[1].replace(/[^0-9]/g, '')
        
        if (nomor.startsWith('0')) nomor = '62' + nomor.slice(1)
        
        await m.reply(`⏳ Sedang membuat akun Admin Panel untuk *${username}*...`)
        
        try {
          const password = username + Math.floor(Math.random() * 1000)
          const email = `${username}@botpanel.com`
          
          await axios.post(`${global.domainPanel}/api/application/users`, {
            email: email,
            username: username,
            first_name: username,
            last_name: "Admin",
            password: password,
            root_admin: true 
          }, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${global.apikeyPanel}`
            }
          })
          
          let txt = `✅ *BERHASIL MEMBUAT ADMIN PANEL*\n\n`
          txt += `👤 *Username:* ${username}\n`
          txt += `🔑 *Password:* ${password}\n`
          txt += `👑 *Role:* Administrator (Root Admin)\n`
          txt += `🌐 *Login:* ${global.domainPanel}\n\n`
          txt += `_Silakan login dan ganti password!_`
          
          try {
            await denn.sendMessage(nomor + '@s.whatsapp.net', { text: txt })
            await m.reply(`✅ *BERHASIL MEMBUAT ADMIN PANEL*\n\nAkun Administrator telah dikirim ke nomor *${nomor}*.`)
          } catch (err) {
            await m.reply(`⚠️ Admin berhasil dibuat, TAPI gagal mengirim pesan ke nomor *${nomor}*.\n\n*Detail Akun:*\n${txt}`)
          }
          
        } catch (e) {
          const errMsg = e.response?.data?.errors?.[0]?.detail || e.message
          m.reply(`❌ *Gagal Membuat Admin:*\n${errMsg}`)
        }
    }
};