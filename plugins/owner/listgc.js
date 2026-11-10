export default {
  command: ['listgc'],
  category: 'owner',
  execute: async (denn, m, { isOwner }) => {
    if (!isOwner) return m.reply(global.msg.owner);
    try {
      const groups = Object.values(await denn.groupFetchAllParticipating());
      let out = `📋 *List Grup (${groups.length})*\n\n`;
      groups.slice(0,30).forEach((g,i) => {
        out += `${i+1}. ${g.subject}\n   ${g.id}\n`;
      });
      await m.reply(out);
    } catch (e) {
      await m.reply('❌ Gagal: ' + e.message);
    }
  }
};
