import util from 'util'

export default {
    command: ['>'],
    category: 'owner',
    execute: async (denn, m, { text, isOwner }) => {
        if (!isOwner) return m.reply(global.msg.owner)
        try {
          let evaled = await eval(text)
          if (typeof evaled !== 'string') evaled = util.inspect(evaled)
          m.reply(util.format(evaled))
        } catch (e) { m.reply(util.format(e)) }
    }
};