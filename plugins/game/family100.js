import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'json', 'family100.json');
const POINTS_BY_RANK = [100, 80, 60, 40, 20, 10];
const MAX_WRONG = 5;
const GAME_TIMEOUT_MS = 5 * 60 * 1000;

let questions = [];
try {
    const parsed = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    if (!Array.isArray(parsed)) throw new Error('Root JSON bukan array');
    const seen = new Set();
    let skipped = 0;
    for (const item of parsed) {
        if (!item?.soal || !Array.isArray(item.jawaban)) { skipped++; continue; }
        const jawaban = item.jawaban.map(x => String(x ?? '').trim().toLowerCase()).filter(Boolean);
        if (!jawaban.length) { skipped++; continue; }
        const key = String(item.soal).toLowerCase().trim();
        if (seen.has(key)) { skipped++; continue; }
        seen.add(key);
        questions.push({ soal: String(item.soal).trim(), jawaban });
    }
    console.log(`[F100] Loaded ${questions.length} soal unik (skip ${skipped}).`);
} catch (e) {
    console.error(`[F100] Gagal load ${DATA_PATH}: ${e.message}`);
}

const games = new Map();

const normalize = s => String(s ?? '').toLowerCase().replace(/[^a-z0-9\s]/gi, ' ').replace(/\s+/g, ' ').trim();

const isMatch = (guess, answer) => {
    const g = normalize(guess), a = normalize(answer);
    if (!g || !a) return false;
    if (g === a) return true;
    const gW = g.split(' '), aW = a.split(' ');
    if (aW.length === 1 && aW[0].length >= 3 && gW.includes(aW[0])) return true;
    if (gW.length === 1 && gW[0].length >= 3 && aW.includes(gW[0])) return true;
    return false;
};

const fmtTime = ms => {
    const s = Math.max(0, Math.floor(ms / 1000));
    return `${Math.floor(s / 60)}m ${s % 60}s`;
};

const buildBoardWithTags = (st) => st.jawaban.map((a, i) => {
    const pts = POINTS_BY_RANK[i] ?? 10;
    if (st.revealed.has(i)) {
        const answerer = st.revealedBy.get(i);
        const tag = answerer ? ` @${answerer.split('@')[0]}` : '';
        return `✅ ${i + 1}. ${a} (${pts})${tag}`;
    }
    return `❓ ${i + 1}. _xxx_ (${pts})`;
}).join('\n');

const buildScores = st => {
    const e = Object.entries(st.scores).sort((a, b) => b[1] - a[1]);
    if (!e.length) return '_Belum ada poin_';
    return e.map(([j, sc], i) => `${['🥇', '🥈', '🥉'][i] || '▫️'} @${j.split('@')[0]} — ${sc} poin`).join('\n');
};

const revealAll = st => st.jawaban.map((a, i) => `${i + 1}. ${a}`).join('\n');

const stopGame = chat => {
    const s = games.get(chat);
    if (!s) return null;
    if (s.timeoutId) clearTimeout(s.timeoutId);
    games.delete(chat);
    return s;
};

const sendGame = async (denn, m, state, text, mentions = []) => {
    const payload = { text: String(text) };
    if (mentions.length) payload.mentions = mentions;
    try {
        const sent = await denn.sendMessage(m.chat, payload, { quoted: m });
        if (sent?.key?.id) state.msgIds.add(sent.key.id);
        return sent;
    } catch (e1) {
        console.error('[F100] send quoted gagal:', e1.message);
    }
    try {
        const sent = await denn.sendMessage(m.chat, payload);
        if (sent?.key?.id) state.msgIds.add(sent.key.id);
        return sent;
    } catch (e2) {
        console.error('[F100] send fallback gagal:', e2.message);
        return null;
    }
};

const collectAnswerers = (state) => Array.from(state.revealedBy.values());

const handleAnswer = async (denn, m, state, input, chat) => {
    // Sudah dijawab?
    for (let i = 0; i < state.jawaban.length; i++) {
        if (state.revealed.has(i) && isMatch(input, state.jawaban[i])) {
            return sendGame(denn, m, state, `⚠️ *${state.jawaban[i]}* sudah terjawab.`);
        }
    }

    for (let i = 0; i < state.jawaban.length; i++) {
        if (!state.revealed.has(i) && isMatch(input, state.jawaban[i])) {
            state.revealed.add(i);
            state.revealedBy.set(i, m.sender);
            const pts = POINTS_BY_RANK[i] ?? 10;
            state.scores[m.sender] = (state.scores[m.sender] || 0) + pts;
            const mentions = collectAnswerers(state);

            if (state.revealed.size === state.jawaban.length) {
                const fin = stopGame(chat);
                return sendGame(denn, m, state,
                    `Jawaban Benar ✅\n\n` +
                    `🏁 *SEMUA JAWABAN TERBUKA!*\n\n` +
                    `📝 *${fin.soal}*\n\n` +
                    `📋 Papan:\n${buildBoardWithTags(fin)}\n\n` +
                    `🏆 Scores akhir:\n${buildScores(fin)}`,
                    mentions
                );
            }

            return sendGame(denn, m, state,
                `Jawaban Benar ✅\n\n` +
                `Balas Lagi\n\n` +
                `📝 *${state.soal}*\n\n` +
                `📋 Papan:\n${buildBoardWithTags(state)}\n\n` +
                `⏱️ Sisa: ${fmtTime(state.expiresAt - Date.now())} · ❌ ${state.wrong}/${MAX_WRONG}`,
                mentions
            );
        }
    }

    state.wrong++;
    const mentions = collectAnswerers(state);

    if (state.wrong >= MAX_WRONG) {
        const fin = stopGame(chat);
        return sendGame(denn, m, state,
            `Jawaban Salah ❌\n\n` +
            `💀 *GAME OVER!* ${MAX_WRONG}× salah.\n\n` +
            `📝 *${fin.soal}*\n\n` +
            `📋 Papan:\n${buildBoardWithTags(fin)}\n\n` +
            `🏆 Scores akhir:\n${buildScores(fin)}`,
            mentions
        );
    }

    return sendGame(denn, m, state,
        `Jawaban Salah ❌\n\n` +
        `Sisa kesempatan: ${MAX_WRONG - state.wrong}/${MAX_WRONG}\n\n` +
        `Balas Lagi\n\n` +
        `📝 *${state.soal}*\n\n` +
        `📋 Papan:\n${buildBoardWithTags(state)}\n\n` +
        `⏱️ Sisa: ${fmtTime(state.expiresAt - Date.now())}`,
        mentions
    );
};

let hookedDenn = null;

const ensureHook = (denn) => {
    if (!denn?.ev || typeof denn.ev.on !== 'function') return;
    if (hookedDenn === denn) return;

    if (global.__f100_listener && hookedDenn?.ev?.off) {
        try { hookedDenn.ev.off('messages.upsert', global.__f100_listener); } catch {}
    }
    hookedDenn = denn;

    const listener = async (update) => {
        try {
            if (update?.type !== 'notify') return;
            const msgs = update.messages;
            if (!Array.isArray(msgs) || !msgs.length) return;
            const m = msgs[0];
            if (!m?.message) return;

            const chat = m.key?.remoteJid;
            if (!chat) return;

            const state = games.get(chat);
            if (!state) return;
            if (state.expiresAt < Date.now()) return;

            const msg = m.message;
            let body = '';
            let ctx = null;

            if (typeof msg.conversation === 'string') {
                body = msg.conversation;
            } else if (msg.extendedTextMessage) {
                body = msg.extendedTextMessage.text || '';
                ctx = msg.extendedTextMessage.contextInfo;
            } else if (msg.imageMessage) {
                body = msg.imageMessage.caption || '';
                ctx = msg.imageMessage.contextInfo;
            } else if (msg.videoMessage) {
                body = msg.videoMessage.caption || '';
                ctx = msg.videoMessage.contextInfo;
            }

            if (!body?.trim()) return;
            if (!ctx?.quotedMessage) return;

            const quotedId = ctx.stanzaId || '';
            const quotedSender = ctx.participant || '';

            const botIds = [
                denn.user?.id,
                denn.user?.lid,
                denn.user?.phoneNumber,
                denn.user?.jid
            ].filter(Boolean).map(x => String(x).split(':')[0].split('@')[0]);

            const senderId = quotedSender ? String(quotedSender).split(':')[0].split('@')[0] : '';

            const idMatch = quotedId && state.msgIds.has(quotedId);
            const senderMatch = senderId && botIds.includes(senderId);

            if (!idMatch && !senderMatch) return;

            const mSender = m.key.participant || m.key.remoteJid;
            const fakeM = {
                chat,
                sender: mSender,
                reply: async (txt) => denn.sendMessage(chat, { text: String(txt) }, { quoted: m })
            };

            await handleAnswer(denn, fakeM, state, body.trim(), chat);
        } catch (err) {
            console.error('[F100] hook error:', err.message);
        }
    };

    global.__f100_listener = listener;
    denn.ev.on('messages.upsert', listener);
    console.log('[F100] 🔌 Self-hook listener terpasang');
};

if (global.__f100_listener && global.denn?.ev?.off) {
    try { global.denn.ev.off('messages.upsert', global.__f100_listener); } catch {}
    global.__f100_listener = null;
    hookedDenn = null;
}

export default {
    command: ['family100', 'fam100'],
    category: 'game',
    execute: async (denn, m, { text, prefix }) => {
        ensureHook(denn);

        const chat = m.chat;
        const input = (text || '').trim();
        const sub = input.toLowerCase().split(/\s+/)[0] || '';
        const state = games.get(chat);

        if (!input || sub === 'start' || sub === 'mulai') {
            if (state) {
                return sendGame(denn, m, state,
                    `⚠️ *Masih ada sesi game Family 100 yang belum selesai di chat ini!*\n\n` +
                    `📝 *${state.soal}*\n\n` +
                    `💬 Reply pesan ini untuk menjawab, atau ketik \`${prefix}family100 nyerah\`\n\n` +
                    `📋 Papan:\n${buildBoardWithTags(state)}\n\n` +
                    `⏱️ Sisa: ${fmtTime(state.expiresAt - Date.now())} · ❌ ${state.wrong}/${MAX_WRONG}`,
                    collectAnswerers(state)
                );
            }

            if (!questions.length) return m.reply('❌ Data soal kosong. Cek `json/family100.json`.');

            const q = questions[Math.floor(Math.random() * questions.length)];
            const ns = {
                soal: q.soal,
                jawaban: q.jawaban,
                revealed: new Set(),
                revealedBy: new Map(),
                scores: {},
                wrong: 0,
                expiresAt: Date.now() + GAME_TIMEOUT_MS,
                timeoutId: null,
                msgIds: new Set()
            };
            games.set(chat, ns);

            ns.timeoutId = setTimeout(async () => {
                if (games.get(chat) !== ns) return;
                stopGame(chat);
                try {
                    await denn.sendMessage(chat, {
                        text: `⏰ *Waktu habis!*\n\nSoal: *${ns.soal}*\n\nJawaban:\n${revealAll(ns)}\n\n🏆 Scores:\n${buildScores(ns)}`
                    });
                } catch (_) {}
            }, GAME_TIMEOUT_MS);

            const sent = await sendGame(denn, m, ns,
                `👨‍👩‍👧‍👦 *FAMILY 100*\n\n` +
                `📝 *${q.soal}*\n\n` +
                `💬 *Reply pesan ini dengan jawabanmu* (tanpa prefix)\n` +
                `atau \`${prefix}family100 <jawaban>\`\n\n` +
                `⏱️ ${fmtTime(GAME_TIMEOUT_MS)} · ❌ maks ${MAX_WRONG}\n` +
                `Kontrol: \`${prefix}family100 status|hint|skip|nyerah\`\n\n` +
                `📋 Papan:\n${buildBoardWithTags(ns)}`
            );

            if (!sent) { stopGame(chat); return m.reply('❌ Gagal kirim soal.'); }
            return;
        }

        if (!state) return m.reply(`❌ Tidak ada game aktif.\nKetik \`${prefix}family100\` untuk mulai.`);

        if (['nyerah', 'stop', 'udahan', 'end', 'selesai', 'batal'].includes(sub)) {
            stopGame(chat);
            return m.reply(
                `🏳️ *Game dihentikan.*\n\nSoal: *${state.soal}*\n\n` +
                `Jawaban:\n${revealAll(state)}\n\n🏆 Scores:\n${buildScores(state)}`
            );
        }
        if (['status', 'board', 'papan', 'skor'].includes(sub)) {
            return m.reply(
                `📝 Soal: *${state.soal}*\n\n${buildBoardWithTags(state)}\n\n` +
                `⏱️ Sisa: ${fmtTime(state.expiresAt - Date.now())}\n` +
                `❌ Salah: ${state.wrong}/${MAX_WRONG}\n\n🏆 Scores:\n${buildScores(state)}`
            );
        }
        if (['hint', 'petunjuk', 'clue'].includes(sub)) {
            const rem = state.jawaban.map((_, i) => i).filter(i => !state.revealed.has(i));
            if (!rem.length) return m.reply('Semua jawaban sudah terbuka!');
            const idx = rem[Math.floor(Math.random() * rem.length)];
            const ans = state.jawaban[idx];
            return m.reply(`💡 *Hint* (${ans.length} huruf): \`${ans.slice(0, Math.max(2, Math.ceil(ans.length / 3))).padEnd(ans.length, '_')}\``);
        }
        if (['skip', 'lewati', 'pass'].includes(sub)) {
            const rem = state.jawaban.map((_, i) => i).filter(i => !state.revealed.has(i));
            if (!rem.length) return m.reply('Semua jawaban sudah terbuka!');
            const idx = rem[Math.floor(Math.random() * rem.length)];
            state.revealed.add(idx);
            state.revealedBy.set(idx, 'skip');

            let msg = `⏭️ *Skip* — dibuka: *${state.jawaban[idx]}*\n\n${buildBoardWithTags(state)}`;
            if (state.revealed.size === state.jawaban.length) {
                const fin = stopGame(chat);
                msg += `\n\n🎉 Semua terbuka!\n\n🏆 Scores akhir:\n${buildScores(fin)}`;
            }
            return m.reply(msg);
        }

        return handleAnswer(denn, m, state, input, chat);
    }
};