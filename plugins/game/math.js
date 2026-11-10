export default {
  command: ['math', 'matematika'],
  category: 'game',
  execute: async (denn, m, { text, prefix }) => {
    const a = Math.floor(Math.random()*20)+1;
    const b = Math.floor(Math.random()*20)+1;
    const ops = ['+','-','*'];
    const op = ops[Math.floor(Math.random()*ops.length)];
    let correct = op==='+' ? a+b : op==='-' ? a-b : a*b;
    if (!text) return m.reply(`🔢 *Math Quiz*\n\nBerapa ${a} ${op} ${b}?\n\nJawab: ${prefix}math <angka>`);
    if (parseInt(text) === correct) await m.reply(`✅ Benar! ${a} ${op} ${b} = ${correct}`);
    else await m.reply(`❌ Salah. Jawaban: ${correct}`);
  }
};
