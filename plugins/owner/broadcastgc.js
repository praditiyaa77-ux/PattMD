export default {
  command: ['bcgc','broadcastgc'],
  category: 'owner',
  execute: async (denn, m, { text, isOwner }) => {
    if (!isOwner) return m.reply(global.msg.owner);
    if (!text) return m.reply('Masukkan teks broadcast');
    try {
      const groups = Object.values(await denn.groupFetchAllParticipating());
      await m.reply(`📢 Mengirim ke ${groups.length} grup...`);
      let sukses = 0;
      for (const g of groups.slice(0, 50)) {
        try {
          await denn.sendMessage(g.id, { text: `📢 *BROADCAST*\n\n${text}` });
          sukses++;
          await new Promise(r => setTimeout(r, 1500));
        } catch {}
      }
      await m.reply(`✅ Broadcast selesai. Berhasil: ${sukses}`);
    } catch (e) {
      await m.reply('❌ ' + e.message);
    }
  }
};
