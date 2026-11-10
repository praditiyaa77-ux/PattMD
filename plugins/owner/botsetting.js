export default {
    command: ['botsetting', 'setting'],
    category: 'owner',
    execute: async (denn, m, { prefix, isOwner }) => {
        if (!isOwner) return m.reply(global.msg.owner)
        
        const st = (val) => val ? '✅' : '❌'
        
        const txt = `⚙️ *BOT SETTINGS*\n\n` +
          `🌐 *Mode Bot* : ${global.db.public ? 'PUBLIC' : 'SELF'}\n` +
          `🤖 *Auto Typing* : ${st(global.autotyping)}\n` +
          `🎭 *Random React* : ${st(global.randomreact)}\n` +
          `📖 *Auto Read SW* : ${st(global.autoreadsw)}\n` +
          `💖 *Auto Like SW* : ${st(global.autolikesw)}\n\n` +
          `_Gunakan ${prefix} <fitur> on/off untuk mengubah_`
          
        await m.reply(txt)
    }
};