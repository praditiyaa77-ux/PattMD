// Ambil ID channel, grup, dan kontak.
//   .idch  <link channel>        atau balas pesan channel yang diteruskan
//   .idgc  [link grup]           tanpa link = grup tempat command dipakai
//   .idkontak [@tag/balas/nomor] tanpa target = dirimu sendiri
// .getid / .id memilih mode otomatis dari input.

const CH_RE = /whatsapp\.com\/channel\/([\w-]+)/i
const GC_RE = /chat\.whatsapp\.com\/([\w-]+)/i

const mono = (v) => '```' + v + '```'
const num = (jid) => String(jid || '').split('@')[0].split(':')[0]

const getQuotedText = (m) => {
    const q = m.quoted?.msg
    if (!q) return ''
    return (typeof q === 'string' ? q : q.text || q.caption || q.conversation || '') || ''
}

// Ubah @lid menjadi nomor telepon bila memungkinkan
const resolvePN = async (denn, m, jid) => {
    if (!jid) return null
    if (jid.endsWith('@s.whatsapp.net')) return jid
    try {
        if (m.isGroup) {
            const meta = await denn.groupMetadata(m.chat)
            const p = meta.participants.find(x => x.id === jid || x.lid === jid)
            const pn = p?.phoneNumber || (p?.jid?.endsWith('@s.whatsapp.net') ? p.jid : null)
            if (pn) return pn
        }
    } catch (_) {}
    try {
        const pn = await denn.signalRepository?.lidMapping?.getPNForLID?.(jid)
        if (pn) return pn.includes('@') ? pn : pn + '@s.whatsapp.net'
    } catch (_) {}
    return null
}

const channelFromLink = async (denn, m, code) => {
    const meta = await denn.newsletterMetadata('invite', code)
    const name = meta?.name || meta?.thread_metadata?.name?.text || '-'
    const subs = meta?.subscribers ?? meta?.thread_metadata?.subscribers_count ?? '-'
    return m.reply(
        `📢 *INFO CHANNEL*\n\n` +
        `🏷️ Nama: ${name}\n` +
        `👥 Pengikut: ${subs}\n` +
        `🆔 ID:\n${mono(meta.id)}`
    )
}

const groupFromLink = async (denn, m, code) => {
    const info = await denn.groupGetInviteInfo(code)
    return m.reply(
        `👥 *INFO GRUP*\n\n` +
        `🏷️ Nama: ${info.subject}\n` +
        `👤 Anggota: ${info.size ?? info.participants?.length ?? '-'}\n` +
        `🆔 ID:\n${mono(info.id)}`
    )
}

const contactInfo = async (denn, m, jid) => {
    const pn = await resolvePN(denn, m, jid)
    let lines = `👤 *INFO KONTAK*\n\n`
    if (pn) lines += `📱 Nomor: ${num(pn)}\n🆔 JID:\n${mono(pn)}\n`
    if (jid.endsWith('@lid')) lines += `🔒 LID:\n${mono(jid)}\n`
    else if (!pn) lines += `🆔 JID:\n${mono(jid)}\n`

    if (!jid.endsWith('@lid') && pn) {
        try {
            const [r] = await denn.onWhatsApp(num(pn))
            lines += `\n${r?.exists ? '✅ Terdaftar di WhatsApp' : '❌ Tidak terdaftar di WhatsApp'}`
        } catch (_) {}
    }
    return m.reply(lines.trim())
}

export default {
    command: ['getid', 'id', 'idch', 'idgc', 'idkontak', 'idkon'],
    category: 'main',
    execute: async (denn, m, { text, command, prefix, getTarget }) => {
        const input = `${text || ''} ${getQuotedText(m)}`
        const chM = input.match(CH_RE)
        const gcM = input.match(GC_RE)
        const wantsContact = ['idkontak', 'idkon'].includes(command)

        try {
            // 1) Channel lewat link
            if (chM && command !== 'idgc' && !wantsContact) return await channelFromLink(denn, m, chM[1])

            // 2) Channel lewat pesan channel yang diteruskan
            const fwd = m.quoted?.msg?.contextInfo?.forwardedNewsletterMessageInfo
            if (fwd?.newsletterJid && command !== 'idgc' && !wantsContact) {
                return m.reply(
                    `📢 *INFO CHANNEL*\n\n` +
                    `🏷️ Nama: ${fwd.newsletterName || '-'}\n` +
                    `🆔 ID:\n${mono(fwd.newsletterJid)}`
                )
            }
            if (command === 'idch') {
                return m.reply(
                    `📢 Kirim link channel atau balas pesan channel yang diteruskan.\n\n` +
                    `Contoh: ${prefix}idch https://whatsapp.com/channel/xxxx`
                )
            }

            // 3) Grup lewat link
            if (gcM && !wantsContact) return await groupFromLink(denn, m, gcM[1])

            // 4) Grup saat ini
            if (command === 'idgc') {
                if (!m.isGroup) return m.reply(`👥 Pakai di dalam grup, atau sertakan link grup:\n${prefix}idgc https://chat.whatsapp.com/xxxx`)
                const meta = await denn.groupMetadata(m.chat)
                return m.reply(
                    `👥 *INFO GRUP*\n\n🏷️ Nama: ${meta.subject}\n👤 Anggota: ${meta.participants.length}\n🆔 ID:\n${mono(m.chat)}`
                )
            }

            // 5) Kontak (tag / balas / nomor / diri sendiri)
            const target = getTarget() || (command === 'idkontak' || command === 'idkon' || !m.isGroup ? m.sender : null)
            if (target) return await contactInfo(denn, m, target)

            // .getid / .id tanpa input di dalam grup → ID grup + ID pengirim
            const meta = await denn.groupMetadata(m.chat)
            await m.reply(`👥 *${meta.subject}*\n🆔 ID Grup:\n${mono(m.chat)}`)
            return await contactInfo(denn, m, m.sender)
        } catch (e) {
            return m.reply(`❌ Gagal mengambil ID: ${e.message}`)
        }
    }
}
