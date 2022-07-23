const mysql = require('../index').mysql

module.exports.info = {
    name: 'unsell',
    usage: "<айди>?",
    aliases: 'unsell, вернуть',
    description: 'посмотреть свои объявления | удалить свое объявление',
    permission: 1,
    enabled: true,
    help: true
};

module.exports.run = async (context, delim) => {
    if(!delim) delim = context.text.split(' ')
    const user = await mysql.execute('SELECT * FROM users WHERE vk = ?', [context.senderId])

    if (delim[1]) {
        const sell = await mysql.execute('SELECT * FROM sells WHERE id = ? AND vk = ?', [delim[1], context.senderId])
        if (!sell[0])
            return context.reply('❌ | Это не твое объявление, поэтому ты не можешь его удалить с маркета')

        await mysql.execute('DELETE FROM `sells` WHERE id = ? AND vk = ?', [delim[1], context.senderId])
        await mysql.execute('UPDATE `users` SET `vimers`=? WHERE vk = ?', [Number(user[0].vimers) + Number(sell[0].amount), context.senderId])

        return context.reply('✅ | Объявление успешно удалено')
    }
    const sells = await mysql.execute('SELECT * FROM sells WHERE vk = ?', [context.senderId])

    if (!sells[0])
        return context.reply(`🛒 | У тебя нет активных объявлений`)

    const list = []

    for (const sell of sells) {
        list.push(`{${sell.id}} Курс: ${sell.rub} руб. Вимеров в наличии: ${sell.amount}`)
    }

    const header = (context.messagePayload) ? '' : '🛒 | Твое(и) активное(ые) объявление(я):\n\n'
    context.reply(header + list.join('\n') + `\n\n🛍 | Снять свое(и) активное(ые) объявление(я) можно командой /unsell <айди объявления>`)
};

module.exports.runPayload = async (context) => {
    this.run(context, context.messagePayload.split(':'))
}