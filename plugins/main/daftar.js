import crypto from 'crypto';
import { getUser, saveUser } from '../../lib/userdb.js';

export default {
    command: ['daftar', 'register'],
    category: 'main',
    execute: async (denn, m, { prefix, text }) => {
        const jid = m.sender;

        // Cek jika sudah terdaftar
        if (getUser(jid)) {
            return m.reply('✅ Kamu sudah terdaftar di database bot.');
        }

        if (!text) {
            return m.reply(
                `📝 *PENDAFTARAN USER*\n\n` +
                `Silakan daftar dengan format:\n` +
                `\`${prefix}daftar <nama> <umur>\`\n\n` +
                `📌 *Contoh:*\n` +
                `\`${prefix}daftar Budi Santoso 20\``
            );
        }

        // Pisahkan nama dan umur (umur diambil dari kata terakhir)
        const parts = text.trim().split(' ');
        if (parts.length < 2) {
            return m.reply(`❌ Format salah!\nGunakan: \`${prefix}daftar <nama> <umur>\``);
        }

        const ageString = parts.pop(); // Ambil umur
        const name = parts.join(' '); // Gabung sisa kata sebagai nama
        
        const age = parseInt(ageString);

        // Validasi Umur
        if (isNaN(age)) {
            return m.reply('❌ Umur harus berupa angka!');
        }
        if (age < 7) {
            return m.reply('👶 Anak kecil gaboleh main HP!');
        }
        if (age >= 70) {
            return m.reply('👴 Gunakan Umur Anda dengan benar!');
        }

        // Generate Serial Number (Format: USER-XXX-YYY)
        const serial = 'USER-' + crypto.randomBytes(3).toString('hex').toUpperCase() + '-' + crypto.randomBytes(2).toString('hex').toUpperCase();

        // Waktu pendaftaran
        const date = new Date();
        const waktu = date.toLocaleDateString('id-ID', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });

        // Simpan ke database
        const userData = {
            name,
            age,
            serial,
            registeredAt: date.toISOString()
        };

        if (saveUser(jid, userData)) {
            await m.reply(
                `✅ *PENDAFTARAN BERHASIL*\n\n` +
                `👤 *Nama:* ${name}\n` +
                `🎂 *Umur:* ${age} Tahun\n` +
                `📅 *Waktu:* ${waktu}\n` +
                `🆔 *Serial Number:* \`${serial}\`\n\n` +
                `_Identitas Serial Number ini akan muncul di profil Anda. Sekarang kamu bisa menggunakan semua fitur bot!_`
            );
        } else {
            m.reply('❌ Gagal menyimpan data pendaftaran. Coba lagi.');
        }
    }
};