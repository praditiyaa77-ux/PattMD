export default {
  command: ['owner', 'creator'],
  category: 'info',
  execute: async (denn, m) => {
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${global.namaowner}\nTEL;type=CELL;type=VOICE;waid=${global.owner}:+${global.owner}\nEND:VCARD`;
    await denn.sendMessage(m.chat, {
      contacts: {
        displayName: global.namaowner,
        contacts: [{ vcard }]
      }
    }, { quoted: m });
  }
};
