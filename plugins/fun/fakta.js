export default {
  command: ['fakta', 'faktamenarik'],
  category: 'fun',
  execute: async (denn, m) => {
    const facts = [
      'Gurita punya 3 jantung.',
      'Madu tidak pernah basi.',
      'Paus biru adalah hewan terbesar di bumi.',
      'Jantung manusia berdetak sekitar 100.000 kali sehari.',
      'Ada lebih banyak pohon di bumi daripada bintang di Bima Sakti yang terlihat.',
      'Kucing tidak bisa merasakan rasa manis.',
      'Tulang manusia lebih kuat dari baja dengan berat yang sama.',
      'Air panas membeku lebih cepat daripada air dingin (Efek Mpemba).'
    ];
    await m.reply(`🧠 *FAKTA MENARIK*\n\n${facts[Math.floor(Math.random()*facts.length)]}`);
  }
};
