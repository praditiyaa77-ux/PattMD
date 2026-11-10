export default {
  command: ['ginfo', 'infogrup'],
  category: 'group',
  execute: async (denn, m) => {
    if (!m.isGroup) return m.reply(global.msg.group);
    try {
      const meta = await denn.groupMetadata(m.chat);
      const admins = meta.participants.filter(p => p.admin).length;
      await m.reply(`📋 *Info Grup*\n\nNama: ${meta.subject}\nID: ${meta.id}\nMember: ${meta.participants.length}\nAdmin: ${admins}\nDibuat: ${new Date(meta.creation*1000).toLocaleDateString('id-ID')}\nDesc: ${(meta.desc||'-').slice(0,300)}`);
    } catch (e) {
      await m.reply('❌ Gagal ambil info');
    }
  }
};
