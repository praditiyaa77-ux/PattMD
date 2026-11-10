export default {
  command: ['emot', 'emoji'],
  category: 'fun',
  execute: async (denn, m) => {
    const emojis = ['😀','😂','🤣','😍','🥰','😎','🤩','🥳','😭','😤','🤯','👻','🤖','👽','🎃','💀','🔥','⭐','💯','🎉'];
    let out = '';
    for (let i=0;i<10;i++) out += emojis[Math.floor(Math.random()*emojis.length)] + ' ';
    await m.reply(`🎲 *Random Emoji*\n\n${out}`);
  }
};
