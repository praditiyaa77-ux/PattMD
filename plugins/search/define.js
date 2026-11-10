export default {
  command: ['define', 'dict', 'arti', 'kbbi'],
  category: 'search',
  execute: async (denn, m, { text, prefix }) => {
    if (!text) return m.reply(`Contoh:\n${prefix}define hello\n${prefix}arti computer`);
    await m.reply(global.msg?.wait || '⏳ Mencari definisi...');

    try {
      // Free Dictionary API (English)
      const res = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(text.split(/\s+/)[0])}`,
        { signal: AbortSignal.timeout(12000) }
      );

      if (!res.ok) {
        // Fallback DuckDuckGo definition
        const ddg = await fetch(
          `https://api.duckduckgo.com/?q=define+${encodeURIComponent(text)}&format=json&no_html=1`,
          { signal: AbortSignal.timeout(10000) }
        );
        const d = await ddg.json();
        if (d.Definition || d.AbstractText) {
          return m.reply(`📖 *Definisi: ${text}*\n\n${d.Definition || d.AbstractText}\n${d.DefinitionURL || d.AbstractURL || ''}`);
        }
        return m.reply(`❌ Definisi tidak ditemukan untuk: *${text}*`);
      }

      const data = await res.json();
      const entry = data[0];
      let out = `📖 *${entry.word}*\n`;
      if (entry.phonetic) out += `🔊 ${entry.phonetic}\n`;
      out += `\n`;

      for (const meaning of (entry.meanings || []).slice(0, 3)) {
        out += `*${meaning.partOfSpeech}*\n`;
        for (const def of (meaning.definitions || []).slice(0, 2)) {
          out += `• ${def.definition}\n`;
          if (def.example) out += `  _Contoh: ${def.example}_\n`;
        }
        out += `\n`;
      }
      await m.reply(out.trim());
    } catch (e) {
      await m.reply(`❌ Error: ${e.message}`);
    }
  }
};
