export default {
  command: ['pantun'],
  category: 'fun',
  execute: async (denn, m) => {
    const list = [
      'Jalan-jalan ke pasar pagi\nJangan lupa beli pepaya\nKalau kamu merasa sepi\nChat aja, aku ada.',
      'Beli bakso di pinggir jalan\nJangan lupa minta kuahnya\nKalau cinta sudah di depan\nJangan sampai lewat saja.',
      'Pergi ke pantai bawa pelampung\nOmbak datang jangan takut\nKalau hatimu sedang bingung\nCerita ke aku, aku dengar.'
    ];
    await m.reply(`📜 *PANTUN*\n\n${list[Math.floor(Math.random()*list.length)]}`);
  }
};
