import { getUser, saveUser } from '../../lib/rpg.js';

export default {
    command: ['heal', 'minum'],
    category: 'rpg',
    execute: async (denn, m) => {
        const user = getUser(m.sender);

        if (user.health >= 100) return m.reply(`❤️ Darahmu sudah penuh (100/100). Kamu tidak butuh ramuan.`);
        
        if (!user.inventory['ramuan'] || user.inventory['ramuan'] < 1) {
            return m.reply(`❌ Kamu tidak punya *Ramuan*!\nBeli di toko dengan *.buy ramuan 1*`);
        }

        // Gunakan Ramuan
        user.inventory['ramuan'] -= 1;
        if (user.inventory['ramuan'] <= 0) delete user.inventory['ramuan'];
        
        user.health = 100;
        saveUser(m.sender, user);

        await m.reply(`🧪 *BERHASIL MINUM RAMUAN!*\n\n❤️ Darahmu sekarang kembali penuh: *100/100*`);
    }
};