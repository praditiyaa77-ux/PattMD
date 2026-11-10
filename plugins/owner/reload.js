export default {
    command: ['reload'],
    category: 'owner',
    execute: async (denn, m, { isOwner }) => {
        if (!isOwner) return m.reply(global.msg.owner);
        
        await m.reply('🔄 Sedang memuat ulang semua plugin...');
        
        try {
            // Memanggil fungsi dari global (tanpa import handler.js)
            const total = await global.reloadPlugins();
            
            await m.reply(`✅ *BERHASIL RELOAD!*\n\nSebanyak *${total}* fitur/plugin telah dimuat ulang tanpa restart.`);
            console.log(`[Reload] Berhasil me-reload ${total} plugin.`);
        } catch (e) {
            m.reply(`❌ Gagal me-reload plugin:\n${e.message}`);
        }
    }
};