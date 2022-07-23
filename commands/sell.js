const mysql = require('../index').mysql
const {Keyboard} = require('vk-io')
const messages = require("../libs/messages");

module.exports.info = {
    name: 'sell',
    usage: "",
    aliases: 'sell, продать',
    description: 'продать вимеры',
    permission: 1,
    enabled: true,
    help: true
};

module.exports.run = async (context) => {
    const user = await mysql.execute('SELECT * FROM users WHERE vk = ?', [context.senderId])

    let amount = await context.question({
            message: '💳 | Укажи, пожалуйста, количество вимеров, которое хочешь продать'
        }
    );
    amount = amount.text

    if (!await messages.isValidSum(amount) || amount < 1)
        return context.send('❌ | Количество указано неверно')

    if (amount > user[0].vimers) return context.send('❌ | Недостаточно вимеров на балансе. Для продолжения необходимо пополнить баланс')

    let vimer = await context.question({
            message: '💶 | Укажи, пожалуйста, цену за 1 вимер в рублях (например 0.5)'
        }
    );
    vimer = vimer.text

    if (/\w/.test(vimer) === false)
        return context.send('❌ | Цена указана неверно')

    if (vimer >= 1 || vimer == 0 || vimer < 0)
        return context.send('❌ | Цена должна быть меньше 1, но больше 0')

    let anw = await context.question({
            message: `🛒 | Ты действительно хочешь продать ${amount} вимеров по цене ${vimer} за 1?`,
            keyboard: Keyboard.builder()
                .inline()
                .textButton({
                    label: "Да",
                    payload: "yes",
                    color: Keyboard.POSITIVE_COLOR
                })
                .textButton({
                    label: "Нет",
                    payload: "no",
                    color: Keyboard.NEGATIVE_COLOR
                })
        }
    );

    if (anw.payload != 'yes') return context.send('❌ | Операция отменена..')

    await mysql.execute('INSERT INTO sells (vk, amount, rub) VALUES(?, ?, ?)', [context.senderId, amount, vimer])
    await mysql.execute('UPDATE `users` SET `vimers`=? WHERE vk = ?', [Number(user[0].vimers) - Number(amount), context.senderId])
    context.reply(`📩 | Твое объявление успешно выставлено и уже появилось на маркете. Снять объявление с маркета можно командой /unsell <айди объявления>`)
};

module.exports.runPayload = async (context) => {
}