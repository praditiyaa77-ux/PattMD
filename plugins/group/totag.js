export default {
  command: ['totag'],
  category: 'group',
  execute: async (denn, m, { text, isOwner, checkAdmin }) => {
    
    if (!m.isGroup) return m.reply(global.msg.group);
    const { isAdmin } = await checkAdmin();
    if (!isAdmin && !isOwner) return m.reply(global.msg.admin);
    if (!m.quoted) return m.reply('Reply pesan yang mau di-tagall');
    try {
      const meta = await denn.groupMetadata(m.chat);
      const members = meta.participants.map(p => p.id);
      // simple forward style
      await denn.sendMessage(m.chat, { text: (m.quoted.text || 'Tagged') + '\n\n' + members.map(id => '@'+id.split('@')[0]).join(' '), mentions: members }, { quoted: m });
    } catch (e) { await m.reply('❌ Error'); }
  
  }
};