const truths = [
  "Apa rahasia terbesar yang belum pernah kamu ceritakan?",
  "Siapa crush kamu saat ini?",
  "Pernah bohong ke orang tua? Tentang apa?",
  "Hal paling memalukan yang pernah kamu lakukan?",
  "Siapa orang yang paling kamu kagumi?",
  "Apa ketakutan terbesar kamu?",
  "Pernah selingkuh? Ceritakan.",
  "Apa kebiasaan buruk kamu?"
];
export default {
  command: ['truth', 'truth'],
  category: 'fun',
  execute: async (denn, m) => {
    await m.reply(`🔵 *TRUTH*\n\n${truths[Math.floor(Math.random()*truths.length)]}`);
  }
};