export default {
  command: ['animequote', 'aquote', 'quotesanime'],
  category: 'anime',
  execute: async (denn, m) => {
    const quotes = [
      { q: "People's lives don't end when they die. It ends when they lose faith.", c: "Itachi Uchiha" },
      { q: "If you don't take risks, you can't create a future.", c: "Monkey D. Luffy" },
      { q: "The world isn't perfect. But it's there for us, doing the best it can.", c: "Roy Mustang" },
      { q: "Believe in yourself. Not in the you who believes in me.", c: "Kamina" },
      { q: "No matter how hard or impossible it is, never lose sight of your goal.", c: "Monkey D. Luffy" },
      { q: "A lesson without pain is meaningless.", c: "Edward Elric" },
      { q: "If you don't like your destiny, don't accept it. Have the courage to change it.", c: "Naruto Uzumaki" },
      { q: "The only ones who should kill are those prepared to be killed.", c: "Lelouch Lamperouge" },
      { q: "Fear is not evil. It tells you what your weakness is.", c: "Gildarts Clive" },
      { q: "Being weak is nothing to be ashamed of. Staying weak is.", c: "Fuegoleon Vermillion" },
      { q: "Sometimes the things that mean the most are the hardest to say.", c: "Natsu Dragneel" },
      { q: "Hard work is worthless for those that don't believe in themselves.", c: "Naruto Uzumaki" }
    ];
    const item = quotes[Math.floor(Math.random() * quotes.length)];
    await m.reply(`🎌 *Anime Quote*\n\n"${item.q}"\n\n— *${item.c}*`);
  }
};
