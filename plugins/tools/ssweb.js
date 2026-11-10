import axios from 'axios'

export default {
    command: ['ssweb', 'screenshot'],
    category: 'tools',
    execute: async (denn, m, { prefix, command, text }) => {
        if (!text) return m.reply(`Contoh: ${prefix + command} https://google.com`)
        await m.reply(global.msg.wait)
        
        let urlTarget = text
        if (!/^https?:\/\//i.test(urlTarget)) urlTarget = 'https://' + urlTarget
        
        try {
          let ssUrl = ''
          try {
            const res = await axios.get(`https://api.microlink.io/?url=${encodeURIComponent(urlTarget)}&screenshot=true&meta=false`)
            if (res.data.status === 'success') {
              ssUrl = res.data.data.screenshot.url
            }
          } catch (e) {}

          if (!ssUrl) {
            ssUrl = `https://s.wordpress.com/mshots/v1/${encodeURIComponent(urlTarget)}?w=1280`
          }
          
          await denn.sendMessage(m.chat, { 
            image: { url: ssUrl }, 
            caption: `📸 *Screenshot Web*\n🔗 ${urlTarget}` 
          }, { quoted: m })
          
        } catch (e) { 
          m.reply(`❌ Gagal mengambil screenshot. Server API sedang sibuk atau URL tidak valid.`) 
        }
    }
};