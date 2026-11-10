export default {
  command: ['listadmin'],
  category: 'group',
  execute: async (denn, m, { text, isOwner, checkAdmin }) => {
    
    if (!m.isGroup) return m.reply(global.msg.group);
    try {
      const meta = await denn.groupMetadata(m.chat);
      const admins = meta.participants.filter(p => p.admin).map(p => '• @' + p.id.split('@')[0]);
      await denn.sendMessage(m.chat, { text: `👑 *List Admin*\n\n${admins.join('\n') || 'Tidak ada'}`, mentions: meta.participants.filter(p=>p.admin).map(p=>p.id) }, { quoted: m });
    } catch (e) { await m.reply('❌ Error'); }
  
  }
};