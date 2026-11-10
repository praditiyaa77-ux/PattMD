import { exec } from 'child_process'
import util from 'util'

export default {
    command: ['$'],
    category: 'owner',
    execute: async (denn, m, { text, isOwner }) => {
        if (!isOwner) return m.reply(global.msg.owner)
        exec(text, (err, stdout) => {
          if (err) return m.reply(err.toString())
          if (stdout) return m.reply(util.format(stdout))
        })
    }
};