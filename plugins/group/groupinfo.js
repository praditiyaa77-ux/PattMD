export default {
  command: ['groupinfo'],
  category: 'group',
  execute: async (denn, m, { text, isOwner, checkAdmin }) => {
    
    if (!m.isGroup) return m.reply(global.msg.group);
    try {
      const meta = await denn.groupMetadata(m.chat);
      const text = `📋 *Group Info*\n\nNama: ${meta.subject}\nID: ${meta.id}\nMember: ${meta.participants.length}\nOwner: ${meta.owner || '-'}\nDesc: ${(meta.desc || '-').slice(0,200)}`;
      await m.reply(text);
    } catch (e) { await m.reply('❌ Gagal ambil info grup'); }
  
  }
};