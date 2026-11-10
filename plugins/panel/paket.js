import axios from 'axios'

export default {
    command: ['1gb', '2gb', '3gb', '4gb', '5gb', '6gb', '7gb', '8gb', '9gb', '10gb', 'unli'],
    category: 'panel',
    execute: async (denn, m, { prefix, command, text, isOwner }) => {
        if (!isOwner) return m.reply(global.msg.owner)
        
        const packages = {
          "1gb": { ram: 1000, disk: 1000, cpu: 100 },
          "2gb": { ram: 2000, disk: 2000, cpu: 200 },
          "3gb": { ram: 3000, disk: 3000, cpu: 300 },
          "4gb": { ram: 4000, disk: 4000, cpu: 400 },
          "5gb": { ram: 5000, disk: 5000, cpu: 500 },
          "6gb": { ram: 6000, disk: 6000, cpu: 600 },
          "7gb": { ram: 7000, disk: 7000, cpu: 700 },
          "8gb": { ram: 8000, disk: 8000, cpu: 800 },
          "9gb": { ram: 9000, disk: 9000, cpu: 900 },
          "10gb": { ram: 10000, disk: 10000, cpu: 1000 },
          "unli": { ram: 0, disk: 0, cpu: 0 }
        }

        const paket = command
        const pkg = packages[paket]
        
        const argsPanel = text.split(' ')
        if (argsPanel.length < 2) return m.reply(`Format: *${prefix + command} <username> <nomorwa>*\nContoh: ${prefix + command} budi 628123456789`)
        
        const username = argsPanel[0].toLowerCase()
        let nomor = argsPanel[1].replace(/[^0-9]/g, '')
        
        if (nomor.startsWith('0')) nomor = '62' + nomor.slice(1)
        
        await m.reply(`⏳ Sedang membuat akun & server panel paket *${paket.toUpperCase()}* untuk *${username}*...`)
        
        try {
          const password = username + Math.floor(Math.random() * 1000)
          const email = `${username}@botpanel.com`
          
          const userRes = await axios.post(`${global.domainPanel}/api/application/users`, {
            email: email,
            username: username,
            first_name: username,
            last_name: "User",
            password: password,
            root_admin: false
          }, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${global.apikeyPanel}`
            }
          })
          
          const userId = userRes.data.attributes.id
          
          const serverRes = await axios.post(`${global.domainPanel}/api/application/servers`, {
            name: `Server ${username}`,
            user: userId,
            egg: parseInt(global.eggId),
            docker_image: "ghcr.io/parkervcp/yolks:nodejs_18", 
            startup: "npm start",
            environment: {},
            limits: {
              memory: pkg.ram,
              swap: 0,
              disk: pkg.disk,
              io: 500,
              cpu: pkg.cpu
            },
            feature_limits: {
              databases: 5,
              backups: 5,
              allocations: 1
            },
            deploy: {
              locations: [parseInt(global.locationId)],
              dedicated_ip: false,
              port_range: []
            }
          }, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${global.apikeyPanel}`
            }
          })
          
          let txt = `✅ *BERHASIL MEMBUAT PANEL*\n\n`
          txt += `👤 *Username:* ${username}\n`
          txt += `🔑 *Password:* ${password}\n`
          txt += `📦 *Paket:* ${paket.toUpperCase()}\n`
          txt += `🌐 *Login:* ${global.domainPanel}\n\n`
          txt += `_Silakan login dan ganti password!_`
          
          try {
            await denn.sendMessage(nomor + '@s.whatsapp.net', { text: txt })
            await m.reply(`✅ *BERHASIL MEMBUAT PANEL*\n\nAkun dengan paket *${paket.toUpperCase()}* telah dikirim ke nomor *${nomor}*.`)
          } catch (err) {
            await m.reply(`⚠️ Panel berhasil dibuat, TAPI gagal mengirim pesan ke nomor *${nomor}*.\n\n*Detail Akun:*\n${txt}`)
          }
          
        } catch (e) {
          const errMsg = e.response?.data?.errors?.[0]?.detail || e.message
          m.reply(`❌ *Gagal Membuat Panel:*\n${errMsg}`)
        }
    }
};