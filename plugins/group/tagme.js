export default {
  command: ['tagme'],
  category: 'group',
  execute: async (denn, m) => {
    if (!m.isGroup) return m.reply(global.msg.group);
    await denn.sendMessage(m.chat, { text: `@${m.sender.split('@')[0]}`, mentions: [m.sender] }, { quoted: m });
  }
};
