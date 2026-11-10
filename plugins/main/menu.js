import os from 'os';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { spawn } from 'child_process';
import { clockString, formatSize } from '../../lib/helper.js';

const TMP_DIR = path.join(process.cwd(), 'database', 'tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

async function downloadImage(url) {
  if (!url || typeof url !== 'string' || !/^https?:\/\//i.test(url)) return null;
  try {
    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 12000,
      maxContentLength: 5 * 1024 * 1024,
      headers: { 'User-Agent': 'Mozilla/5.0' },
      validateStatus: () => true
    });
    if (res.status >= 400) return null;
    const buf = Buffer.from(res.data || []);
    if (buf.length < 100) return null;
    const head = buf.slice(0, 200).toString('utf8').toLowerCase();
    if (head.includes('<!doctype') || head.includes('<html')) return null;
    return buf;
  } catch (e) {
    console.log('[Menu] download thumb gagal:', e.message);
    return null;
  }
}

function makeSquareThumb(buffer, size = 300) {
  return new Promise((resolve) => {
    const tmpIn = path.join(TMP_DIR, `menu_in_${Date.now()}.jpg`);
    const tmpOut = path.join(TMP_DIR, `menu_out_${Date.now()}.jpg`);
    try { fs.writeFileSync(tmpIn, buffer); } catch { return resolve(null); }

    const ff = spawn('ffmpeg', [
      '-y', '-i', tmpIn,
      '-vf', `crop='min(iw,ih)':'min(iw,ih)',scale=${size}:${size}:flags=lanczos`,
      '-q:v', '5', '-frames:v', '1', tmpOut
    ]);

    ff.on('close', (code) => {
      try { fs.unlinkSync(tmpIn); } catch {}
      if (code !== 0) {
        try { fs.unlinkSync(tmpOut); } catch {}
        return resolve(null);
      }
      try {
        const out = fs.readFileSync(tmpOut);
        fs.unlinkSync(tmpOut);
        if (out.length < 100 || out.length > 200 * 1024) return resolve(null);
        resolve(out);
      } catch { resolve(null); }
    });

    ff.on('error', () => {
      try { fs.unlinkSync(tmpIn); } catch {}
      resolve(null);
    });
  });
}

function getTimeInZone(timeZone) {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(new Date()).replace(/\./g, ':');
  } catch {
    return '--:--:--';
  }
}

export default {
  command: ['menu', 'help'],
  category: 'main',
  execute: async (denn, m, { prefix }) => {
    const uptime = clockString(process.uptime() * 1000);
    const tanggal = new Date().toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    const totalFitur = global.plugins ? global.plugins.size : 0;
    const ram = `${formatSize(os.totalmem() - os.freemem())} / ${formatSize(os.totalmem())}`;
    const platform = os.platform();

    // ⏰ Multi timezone Indonesia
    const jamWIB  = getTimeInZone('Asia/Jakarta');
    const jamWITA = getTimeInZone('Asia/Makassar');
    const jamWIT  = getTimeInZone('Asia/Jayapura');

    // Menggunakan Map untuk mengelompokkan command utama dan alias
    const categorized = {};
    if (global.plugins) {
      global.plugins.forEach((plugin) => {
        const cat = (plugin.category || 'other').toLowerCase();
        const cmds = Array.isArray(plugin.command) ? plugin.command : [plugin.command];
        
        // Ambil command pertama sebagai utama, sisanya alias
        const mainCmd = cmds[0];
        const aliases = cmds.slice(1).filter(c => typeof c === 'string' && c.trim());

        if (typeof mainCmd !== 'string' || !mainCmd.trim()) return;

        if (!categorized[cat]) categorized[cat] = new Map();

        // Jika command utama sudah ada, tambahkan aliasnya. Jika belum, buat baru.
        if (categorized[cat].has(mainCmd)) {
          const existingAliases = categorized[cat].get(mainCmd);
          aliases.forEach(alias => {
            if (!existingAliases.includes(alias)) existingAliases.push(alias);
          });
        } else {
          categorized[cat].set(mainCmd, aliases);
        }
      });
    }

    const categoryOrder = [
      'main', 'downloader', 'tools', 'group', 'rpg', 'fun', 'game',
      'anime', 'islamic', 'info', 'search', 'owner', 'panel', 'maker', 'other'
    ];
    
    const categoryTitles = {
      main: 'MAIN MENU',
      downloader: 'DOWNLOADER',
      tools: 'CONVERT & TOOLS',
      group: 'GROUP MENU',
      rpg: 'RPG & EKONOMI',
      fun: 'FUN & ISENG',
      game: 'GAME',
      anime: 'ANIME',
      islamic: 'ISLAMIC',
      info: 'INFORMASI',
      search: 'PENCARIAN',
      owner: 'OWNER MENU',
      panel: 'PANEL MENU',
      maker: 'MAKER ',
      other: 'FITUR LAINNYA'
    };

    let dynamicMenu = '';
    
    for (const cat of categoryOrder) {
      if (!categorized[cat] || categorized[cat].size === 0) continue;
      
      const title = categoryTitles[cat] || cat.toUpperCase();
      
      dynamicMenu += `\n┏━━━「 *${title}* 」━━━┓\n`;
      
      // Urutkan berdasarkan abjad command utama
      const sortedEntries = Array.from(categorized[cat].entries()).sort((a, b) => a[0].localeCompare(b[0]));
      
      for (const [mainCmd, aliases] of sortedEntries) {
        let line = `┃ ➤ ${prefix}${mainCmd}`;
        if (aliases.length > 0) {
          line += ` (${aliases.map(a => prefix + a).join(', ')})`;
        }
        dynamicMenu += line + '\n';
      }
      
      dynamicMenu += `┗━━━━━━━━━━━━━━━━\n`;
    }

    const menu = `
╭━━━━「 *${global.namabot}* 」
┃
┃ 🕐 *ZONA WAKTU INDONESIA*
┃ ┣ 🌏 WIB  ➤  ${jamWIB}
┃ ┣ 🌏 WITA ➤  ${jamWITA}
┃ ┗ 🌏 WIT  ➤  ${jamWIT}
┃
┃ 📅 *Tanggal*  : ${tanggal}
┃ ⚡ *Uptime*   : ${uptime}
┃ 📊 *Fitur*    : ${totalFitur}
┃ 💻 *OS*       : ${platform}
┃ 🧠 *RAM*      : ${ram}
┃ 👤 *User*     : ${m.pushName || 'User'}
┃ 🌐 *Mode*     : ${global.db?.public ? 'PUBLIC' : 'SELF'}
┃
╰━━━━━━━━━━━━━━━━
${dynamicMenu}
*✦ Powered by ©${global.namaowner} ✦*
`.trim();

    const rawThumb = await downloadImage(global.thumbnail);
    const squareThumb = rawThumb ? await makeSquareThumb(rawThumb) : null;

    const msgContent = {
      image: { url: global.fotomenu },
      caption: menu,
      contextInfo: {
        externalAdReply: {
          title: global.namabot,
          body: `Fitur: ${totalFitur} | Uptime: ${uptime}`,
          thumbnail: squareThumb || undefined,
          thumbnailUrl: !squareThumb ? global.thumbnail : undefined,
          sourceUrl: global.linkMenu,
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    };

    try {
      await denn.sendMessage(m.chat, msgContent, { quoted: m });
    } catch (e) {
      console.log('[Menu] kirim dengan ctx gagal:', e.message);
      try {
        await denn.sendMessage(m.chat, { text: menu, contextInfo: msgContent.contextInfo }, { quoted: m });
        return;
      } catch (_) {}
      await m.reply(menu);
    }
  }
};