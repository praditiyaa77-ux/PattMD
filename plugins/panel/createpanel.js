export default {
    command: ['createpanel', 'buatpanel'],
    category: 'panel',
    execute: async (denn, m, { prefix, isOwner }) => {
        if (!isOwner) return m.reply(global.msg.owner)
        m.reply(`*CARA BUAT PANEL:*\n\nFormat: *${prefix}<paket> <username> <nomorwa>*\n\n*Contoh:*\n➤ ${prefix}1gb budi 628123456789\n➤ ${prefix}unli andi 628987654321\n\n*List Paket:*\n1gb, 2gb, 3gb, 4gb, 5gb, 6gb, 7gb, 8gb, 9gb, 10gb, unli`)
    }
};