// Fitur Verifikasi Alight Motion Premium + Bulk via Mail.tm
import axios from 'axios'
import crypto from 'crypto'

// ============================================================
//  KONFIGURASI ALIGHT MOTION (FIREBASE)
// ============================================================
const AM_API_KEY = 'AIzaSyDtG1AU22ErnQD60AzBAcaknySiz9_CEq0'
const AM_IDT = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty'
const AM_VERIFY_PURCHASE = 'https://us-central1-alight-creative.cloudfunctions.net/verifyPurchase'
const AM_PRODUCT_ID = 'am.full.sub.annual.19q4'
const AM_MOCK_TOKEN = 'mmgaobamlahbbeccfplmbkbb.AO-J1OzqG0or_GJJIx-ms8GrTm-jaglCRfhQSRPUZKpl2YspYS-oN7_94uv8RC5vQbvd_Ios2pPDStZ2n7F0hLE3FiOU7HS3R6Fquulv5xLXFECSv4ctElw'
const AM_FIREBASE_INSTANCE_TOKEN = 'cSDnCyp3T-uwp07z3tL86T:APA91bFkmvvsHw5nnqa1SBFci-99DRsKClLiETdRrVcJjS5yBx1v_FbCb1d8WhBuea_zmwnYBktyTIzcRhN4b6uNOUur9wPc0gKXmJDoZic0LhNq5V2s0xI'

const AM_H1 = { 'content-type': 'application/json', 'x-android-package': 'com.alightcreative.motion', 'x-android-cert': 'ECA6BF91B8715A6F810ED0BBFC65B6CD578F52A8', 'user-agent': 'dalvik/2.1.0 (linux; u; android 15; 23127pn0cc build/bp1a.250505.005)' }
const AM_H2 = { 'content-type': 'application/json; charset=utf-8', 'user-agent': 'okhttp/3.12.1', 'accept-encoding': 'gzip' }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const lastEmail = new Map() 

// ============================================================
//  HELPER FIREBASE
// ============================================================
function amDip() { 
    return `${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}` 
}

function amSpoofHeaders(base) { 
    return Object.assign({}, base, { 
        'x-forwarded-for': amDip(), 'x-real-ip': amDip(), 'client-ip': amDip(), 
        'x-client-ip': amDip(), 'x-originating-ip': amDip(), 'x-cluster-client-ip': amDip() 
    }) 
}

async function amSendLink(email) {
    const url = `${AM_IDT}/getOobConfirmationCode?key=${AM_API_KEY}`
    const body = { 
        requestType: 6, email: email, androidInstallApp: true, canHandleCodeInApp: true, 
        continueUrl: 'https://alightcreative.com', iosBundleId: 'com.alightcreative.motion', 
        androidPackageName: 'com.alightcreative.motion', androidMinimumVersion: '585', clientType: 'CLIENT_TYPE_ANDROID' 
    }
    const r = await axios.post(url, body, { headers: amSpoofHeaders(AM_H1), timeout: 20000, validateStatus: () => true })
    if (r.data?.error) throw new Error(r.data.error.message)
    if (r.status >= 400) throw new Error(`Alight API HTTP ${r.status}`)
    return true
}

function amExtractOobCode(raw) {
    if (!raw) return null
    const base = String(raw).replace(/&amp;/g, '&').trim()
    const variants = [base]
    try { const dec = decodeURIComponent(base); if (dec !== base) variants.push(dec) } catch (_) {}

    for (const s of variants) {
        try {
            const u = new URL(s)
            const direct = u.searchParams.get('oobCode')
            if (direct) return direct.replace(/[^a-zA-Z0-9_-]/g, '')
            const nested = u.searchParams.get('link') || u.searchParams.get('q')
            if (nested) {
                let inner = nested
                try { inner = decodeURIComponent(inner) } catch (_) {}
                try {
                    const iu = new URL(inner)
                    const ic = iu.searchParams.get('oobCode')
                    if (ic) return ic.replace(/[^a-zA-Z0-9_-]/g, '')
                } catch (_) {
                    const m = inner.match(/oobCode=([a-zA-Z0-9_-]+)/i)
                    if (m) return m[1]
                }
            }
        } catch (_) {}
        const m = s.match(/oobCode=([a-zA-Z0-9_-]+)/i)
        if (m) return m[1]
    }
    return null
}

async function amVerifyLink(email, rawLink) {
    const code = amExtractOobCode(rawLink)
    if (!code) throw new Error('Kode oobCode tidak valid atau link rusak.')
    const url = `${AM_IDT}/emailLinkSignin?key=${AM_API_KEY}`
    const body = { email, oobCode: code, clientType: 'CLIENT_TYPE_ANDROID' }
    const r = await axios.post(url, body, { headers: amSpoofHeaders(AM_H1), timeout: 20000, validateStatus: () => true })
    if (r.data?.error) throw new Error(r.data.error.message)
    if (r.status >= 400 || !r.data?.idToken) throw new Error(`Email sign-in gagal: HTTP ${r.status}`)
    return { idToken: r.data.idToken }
}

async function amActivatePremium(idToken) {
    const orderId = 'emy-' + crypto.randomBytes(6).toString('hex')
    const body = { data: { productId: AM_PRODUCT_ID, token: AM_MOCK_TOKEN, skuType: 'subs', orderId: orderId } }
    const headers = Object.assign({}, AM_H2, { authorization: 'Bearer ' + idToken, 'firebase-instance-id-token': AM_FIREBASE_INSTANCE_TOKEN })
    const r = await axios.post(AM_VERIFY_PURCHASE, body, { headers: amSpoofHeaders(headers), validateStatus: () => true, timeout: 20000 })
    if (r.status >= 400) throw new Error(`Aktivasi premium gagal: HTTP ${r.status}`)
    const data = r.data
    if (data.error || (data.result && data.result.success === false)) throw new Error(`Ditolak server: ${JSON.stringify(data).slice(0, 50)}`)
    return true
}

// ============================================================
//  HELPER MAIL.TM (DENGAN RETRY 429 & CUSTOM PASSWORD)
// ============================================================
async function createMailTmAccount(retry = 3) {
    try {
        const domRes = await axios.get('https://api.mail.tm/domains', { timeout: 15000 })
        const domains = (domRes.data['hydra:member'] || []).filter(d => d.isActive !== false)
        if (!domains.length) throw new Error('Tidak ada domain mail.tm aktif')
        
        const domain = domains[Math.floor(Math.random() * domains.length)].domain
        const address = `${crypto.randomBytes(6).toString('hex')}@${domain}`
        
        // FORMAT PASSWORD: Emy + Tanggal + Bulan + Tahun + Jam + Menit + Random 4 char
        // Contoh: Emy241020261430a1b2
        const now = new Date()
        const dd = String(now.getDate()).padStart(2, '0')
        const mm = String(now.getMonth() + 1).padStart(2, '0')
        const yyyy = now.getFullYear()
        const hh = String(now.getHours()).padStart(2, '0')
        const min = String(now.getMinutes()).padStart(2, '0')
        const uniq = crypto.randomBytes(2).toString('hex')
        const password = `Emy${dd}${mm}${yyyy}${hh}${min}${uniq}`
        
        await axios.post('https://api.mail.tm/accounts', { address, password }, { timeout: 15000 })
        const tokenRes = await axios.post('https://api.mail.tm/token', { address, password }, { timeout: 15000 })
        
        return { address, password, token: tokenRes.data.token }
    } catch (e) {
        // Retry jika kena 429
        if (e.response && e.response.status === 429 && retry > 0) {
            await new Promise(r => setTimeout(r, 3000))
            return createMailTmAccount(retry - 1)
        }
        throw e
    }
}

async function checkMailTmInbox(token, seenIds, retry = 2) {
    try {
        const res = await axios.get('https://api.mail.tm/messages?page=1', {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000
        })
        const msgs = res.data['hydra:member'] || []
        for (const msg of msgs) {
            if (seenIds.has(msg.id)) continue
            seenIds.add(msg.id)
            try {
                const detail = await axios.get(`https://api.mail.tm/messages/${msg.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 10000
                })
                const text = (detail.data.text || '') + ' ' + (Array.isArray(detail.data.html) ? detail.data.html.join(' ') : (detail.data.html || ''))
                const urls = text.match(/https?:\/\/[^\s<>"']+/gi) || []
                for (let url of urls) {
                    const clean = url.replace(/[<>"')\]]+$/, '')
                    if (clean.includes('oobCode=') || clean.includes('firebaseapp.com')) return clean
                }
            } catch (e) { /* skip */ }
        }
    } catch (e) { 
        if (e.response && e.response.status === 429 && retry > 0) {
            await new Promise(r => setTimeout(r, 2000))
            return checkMailTmInbox(token, seenIds, retry - 1)
        }
    }
    return null
}

// ============================================================
//  EXPORT PLUGIN BOT WA
// ============================================================
export default {
    command: ['sendlink', 'verifylink', 'bulk'],
    category: 'tools',
    execute: async (denn, m, { text, command, prefix }) => {
        const senderId = String(m.sender).split('@')[0]

        // ================== SENDLINK ==================
        if (command === 'sendlink') {
            const email = text.trim()
            if (!email || !EMAIL_RE.test(email)) return m.reply(`Contoh: ${prefix}sendlink email@contoh.com`)
            
            await m.reply(global.msg.wait)
            try {
                await amSendLink(email)
                lastEmail.set(senderId, email)
                return m.reply(`✅ *Link terkirim!*\n\nSilakan cek email *${email}* (termasuk folder spam). Copy link verifikasi dari Alight Creative, lalu kirim dengan format:\n\n${prefix}verifylink <link_dari_email>`)
            } catch (e) {
                return m.reply(`❌ Gagal: ${e.message}`)
            }
        }

        // ================== VERIFYLINK ==================
        if (command === 'verifylink') {
            let email, magicLink
            let raw = `${text} ${m.quoted?.text || ''}`.trim()
            magicLink = raw.match(/https?:\/\/\S+/)?.[0]
            if (magicLink) raw = raw.replace(magicLink, ' ').trim()
            email = raw.match(EMAIL_RE)?.[0]
            if (!email) email = lastEmail.get(senderId)

            if (!magicLink || !/^https?:\/\//i.test(magicLink)) return m.reply(`❌ Harap sertakan link dari email.\nContoh: ${prefix}verifylink https://...`)
            if (!email || !EMAIL_RE.test(email)) return m.reply(`❌ Email tidak diketahui. Jalankan dulu: ${prefix}sendlink email@contoh.com`)

            await m.reply(global.msg.wait)
            try {
                const session = await amVerifyLink(email, magicLink)
                await amActivatePremium(session.idToken)
                return m.reply(`✅ *BERHASIL!*\n\nEmail: *${email}*\nStatus: *PREMIUM AKTIF*\n\nSilakan buka aplikasi Alight Motion dan login menggunakan email tersebut.`)
            } catch (e) {
                return m.reply(`❌ Gagal Verifikasi: ${e.message}`)
            }
        }

        // ================== BULK VERIFY (MAIL.TM) ==================
        if (command === 'bulk') {
            const count = parseInt(text.trim())
            if (isNaN(count) || count < 1 || count > 10) {
                return m.reply(`❌ Format: ${prefix}bulk <1-10>\nContoh: ${prefix}bulk 5`)
            }

            await m.reply(`⏳ *BULK VERIFY ${count} AKUN*\n\n1️⃣ Membuat ${count} email...`)

            const accounts = []

            // STEP 1: Buat semua email (Jeda 2.5 detik untuk hindari 429)
            for (let i = 0; i < count; i++) {
                try {
                    const acc = await createMailTmAccount()
                    accounts.push({ ...acc, status: 'waiting', seenIds: new Set(), error: null })
                } catch (e) {
                    accounts.push({ address: null, status: 'error', error: `Gagal buat email #${i+1}: ${e.message}` })
                }
                await new Promise(r => setTimeout(r, 2500))
            }

            const totalCreated = accounts.filter(a => a.address).length
            await m.reply(`2️⃣ Mengirim magic link ke ${totalCreated} email...`)

            // STEP 2: Kirim magic link ke semua email
            for (const acc of accounts) {
                if (!acc.address || acc.status === 'error') continue
                try {
                    await amSendLink(acc.address)
                    await new Promise(r => setTimeout(r, 1500))
                } catch (e) {
                    acc.status = 'error'
                    acc.error = `Gagal kirim link: ${e.message}`
                }
            }

            await m.reply(`3️⃣ Memantau inbox & verifikasi otomatis (maks 2 menit)...\n\n_Bot akan memproses satu per satu. Mohon tunggu._`)

            // STEP 3: Polling semua inbox (maks 2 menit)
            const startTime = Date.now()
            const TIMEOUT = 120000 // 2 menit

            while (Date.now() - startTime < TIMEOUT) {
                let stillWaiting = 0
                for (const acc of accounts) {
                    if (acc.status !== 'waiting') continue
                    stillWaiting++

                    const link = await checkMailTmInbox(acc.token, acc.seenIds)
                    if (link) {
                        try {
                            const session = await amVerifyLink(acc.address, link)
                            await amActivatePremium(session.idToken)
                            acc.status = 'success'
                        } catch (e) {
                            acc.status = 'failed'
                            acc.error = e.message
                        }
                        await new Promise(r => setTimeout(r, 1000))
                    }
                }
                if (stillWaiting === 0) break
                await new Promise(r => setTimeout(r, 4000))
            }

            // STEP 4: Tandai yang timeout
            for (const acc of accounts) {
                if (acc.status === 'waiting') acc.status = 'timeout'
            }

            // STEP 5: Susun Laporan Lengkap (termasuk Kredensial Email)
            const successCount = accounts.filter(a => a.status === 'success').length
            const timeoutCount = accounts.filter(a => a.status === 'timeout').length
            const errorCount = accounts.filter(a => a.status === 'error' || a.status === 'failed').length

            let report = `📊 *LAPORAN BULK VERIFIKASI*\n`
            report += `━━━━━━━━━━━━━━━━━━\n\n`
            report += `🎯 Total Target : ${count} Akun\n`
            report += `✅ Sukses       : ${successCount} Akun\n`
            report += `⏰ Timeout      : ${timeoutCount} Akun\n`
            report += `❌ Gagal        : ${errorCount} Akun\n\n`
            report += `━━━━━━━━━━━━━━━━━━\n\n`
            report += `🔐 *KREDENSIAL EMAIL (SIMPAN!)*\n`
            report += `_Login di https://mail.tm untuk akses inbox secara manual kapan saja, walaupun bot sudah selesai._\n\n`

            let idx = 1
            for (const acc of accounts) {
                const icon = acc.status === 'success' ? '✅' : acc.status === 'timeout' ? '⏰' : '❌'
                report += `${idx++}. ${icon} *${acc.status.toUpperCase()}*\n`
                if (acc.address) {
                    report += `   📧 Email    : \`${acc.address}\`\n`
                    report += `   🔑 Password : \`${acc.password}\`\n`
                }
                if (acc.error) {
                    report += `   ⚠️ Error    : _${acc.error}_\n`
                }
                report += `\n`
            }

            report += `━━━━━━━━━━━━━━━━━━\n`
            report += `💡 *Catatan:*\n`
            report += `• Akun *SUKSES*: Premium sudah aktif, silakan login di aplikasi Alight Motion.\n`
            report += `• Akun *TIMEOUT*: Email belum masuk dalam 2 menit. Login ke https://mail.tm, cek inbox, copy link verifikasi, lalu kirim ke bot dengan:\n\`${prefix}verifylink <email> <link>\`\n`
            report += `• Akun *GAGAL*: Terjadi kesalahan saat verifikasi.`

            return m.reply(report)
        }
    }
}