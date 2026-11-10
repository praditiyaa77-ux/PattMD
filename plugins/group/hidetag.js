export default {
  command: ['hidetag'],
  category: 'group',
  execute: async (denn, m, { text, isOwner, checkAdmin }) => {
    
    if (!m.isGroup) return m.reply(global.msg.group);
    const { isAdmin, isBotAdmin } = await checkAdmin();
    if (!isAdmin && !isOwner) return m.reply(global.msg.admin);
    try {
      const meta = await denn.groupMetadata(m.chat);
      const members = meta.participants.map(p => p.id);
      await denn.sendMessage(m.chat, { text: text || 'Hi', mentions: members }, { quoted: m });
    } catch (e) { await m.reply('❌ Gagal hidetag'); }
  
  }
};