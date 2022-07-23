const mysql = require('../index').mysql
const axios = require("axios");
const {Keyboard} = require('vk-io')
const config = require("../config");
const messages = require("../libs/messages");
const vk = require("../index").vk
const sender = require('../index').sender



module.exports.info = {
    name: 'buy',
    usage: "<айди объявления>",
    aliases: 'buy, купить, куп, бай, буй',
    description: 'купить вимеры',
    permission: 1,
    enabled: true,
    help: true
};

module.exports.run = async (context, delim) => {
    if (!delim) delim = context.text.split(' ')

    if(!delim[1]) return sender.noArguments(context, delim, this.info)

    const sells = await mysql.execute('SELECT * FROM `sells` WHERE vk != ? AND id = ?', [context.senderId, delim[1]])

    if (!sells[0]) return context.reply("❌ | Объявление с таким ID не найдено")

    context.reply({
        message: `🛍 | Предложение от ID ${sells[0].id}:`
            + `\n● Продавец: @id${sells[0].vk}`
            + `\n● Вимеров в наличии: ${sells[0].amount}`
            + `\n● Курс: ${sells[0].rub} руб. за 1 вимер`,
        keyboard: Keyboard.builder()
            .inline()
            .textButton({
                label: "Продолжить",
                payload: `buy:${sells[0].id}`,
                color: Keyboard.POSITIVE_COLOR
            })
    })
};

module.exports.runPayload = async (context) => {
    const delim = context.messagePayload.split(":")

    let sells = await mysql.execute('SELECT * FROM `sells` WHERE vk != ? AND id = ?', [context.senderId, delim[1]])

    if (!sells[0]) return context.reply('❌ | Неизвестная сделка..')

    let pok = await mysql.execute('SELECT * FROM users WHERE vk = ?', [context.senderId])
    let prod = await mysql.execute('SELECT * FROM users WHERE vk = ?', [sells[0].vk])

    let amount = await context.question({
            message: '💳 | Введи, пожалуйста, количество вимеров, которое хочешь приобрести'
        }
    );
    amount = amount.text

    if (!await messages.isValidSum(amount)) {
        return context.send('❌ | Количество вимеров указано неверно')
    }

    if (amount <= 0) {
        return context.send('❌ | Количество вимеров для покупки должно быть больше нуля')
    } else if (amount * sells[0].rub > pok[0].rubs) {
        return context.send('❌ | Недостаточно средств на балансе. Для продолжения необходимо пополнить баланс')
    }

    if (sells[0].amount < amount)
        return context.send('❌ | Такого количества вимеров нет в наличии')


    let to = await context.question({
            message: '💳 | Введи, пожалуйста, ник на который должны прийти вимеры\n\n⚠ Обрати внимание на правильность написания ника и, пожалуйста, запомни, что наша группа не несет ответственность за неверные переводы'
        }
    );
    to = to.text

    let pay = await context.question({
            message: `🛒 | Перевести @id${sells[0].vk} ${await messages.plurals(amount * sells[0].rub, "рубль", "рубля", "рублей")}. за покупку ${await messages.plurals(amount, "вимера", "вимеров", "вимеров")}?`,
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

    if (pay.payload == 'yes') {
        sells = await mysql.execute('SELECT * FROM `sells` WHERE vk != ? AND id = ?', [context.senderId, delim[1]])

        if (!sells[0])
            return context.send('✅ | Объявление успешно удалено')

        pok = await mysql.execute('SELECT * FROM users WHERE vk = ?', [context.senderId])
        prod = await mysql.execute('SELECT * FROM users WHERE vk = ?', [sells[0].vk])

        if (amount * sells[0].rub > pok[0].rubs) {
            return context.send('❌ | Недостаточно средств на балансе. Для продолжения необходимо пополнить баланс')
        }

        if (sells[0].amount < amount)
            return context.send('❌ | Такого количества вимеров нет в наличии')

        //деньги
        const res = await axios.get(`${config.vimeworld.vimeapi_domen}/giveVimers.php?token=${config.vimeworld.vimeapi_token}&to=${to}&vimers=${amount}`)

        if (res.data.code != 1)
            return context.reply(`❌ | Что-то пошло не так, операция отменена..`)

        //обновление балансов
        await mysql.execute('UPDATE `users` SET `rubs`=? WHERE vk = ?', [Number(pok[0].rubs) - Number(amount * sells[0].rub), context.senderId])
        await mysql.execute('UPDATE `users` SET `rubs`=? WHERE vk = ?', [Number(prod[0].rubs) + Number(amount * sells[0].rub), sells[0].vk])

        //объявление
        if (sells[0].amount - amount <= 0) {
            await mysql.execute('DELETE FROM `sells` WHERE `id` = ?', [sells[0].id])
        } else {
            await mysql.execute('UPDATE `sells` SET `amount`=? WHERE id = ?', [sells[0].amount - amount, sells[0].id])
        }

        //покупатель
        context.send(`✅ | Сделка прошла успешно. Спасибо за покупку! Оставь, пожалуйста, отзыв: https://vk.com/topic-207749865_48239853`)

        //продавец
        try {
            vk.api.messages.send({
                user_id: sells[0].vk,
                random_id: 0,
                message: `🆕 | У тебя купили ${await messages.plurals(amount, "вимер", "вимера", "вимеров")}. Ты получил ${await messages.plurals(amount * sells[0].rub, "рубль", "рубля", "рублей")}`
                    + `\n🎊 | Вывести деньги можно в своем профиле`
            })
        } catch (e) {
            console.error(e)
        }
    } else if (pay.payload == 'no') {
        context.send(`❌ | Операция отменена..`)
    } else {
        context.send(`❌ | Недопустимый ответ. Операция отменена.. `)
    }
}