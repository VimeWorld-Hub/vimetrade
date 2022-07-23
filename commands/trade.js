const mysql = require('../index').mysql

const axios = require("axios");
const config = require("../config");
const messages = require("../libs/messages");
const vk = require("../index").vk
const sender = require('../index').sender

const {API, resolveResource, Keyboard, getRandomId} = require('vk-io')
const md5 = require("md5");
const api = new API({
    token: config.vimpy
});

module.exports.info = {
    name: 'trade',
    usage: "",
    aliases: 'trade, сделка',
    description: 'провести безопасную сделку',
    permission: 1,
    enabled: true,
    help: true
};

module.exports.run = async (context, delim) => {
    let im = await context.question({
        message: `🧛 | В этой сделке ты будешь:`,
        keyboard: Keyboard.builder().inline()
            .textButton({
                label: '💼 Продавцом',
                payload: 'seller',
                color: Keyboard.PRIMARY_COLOR
            })
            .textButton({
                label: '👑 Покупателем',
                payload: 'buyer',
                color: Keyboard.PRIMARY_COLOR
            })
            .row()
            .textButton({
                label: '◀️ Отмена',
                payload: 'back'
            })
    })
    im = im.payload

    if (im != 'seller' && im != 'buyer')
        return context.send('❌ | Отмена..')

    if (im == 'seller') {
        let buyer = await context.question('👑 | Введи ID или никнейм покупателя (из ВКонтакте)')

        if(buyer.payload)
            return context.send('❌ | Отмена..')

        const resource = await resolveResource({
            api,
            resource: buyer.text
        })
        if (!resource || !resource.id)
            return context.send('❌ | Неверный айди или ник')
        const us_get = await mysql.execute('SELECT * FROM users WHERE vk = ?', [resource.id])
        if (!us_get[0])
            return context.send('❌ | Пользователь не найден')

        const dup = await mysql.execute('SELECT * FROM `trades` WHERE ((seller = ? and buyer = ?) OR (seller = ? and buyer = ?)) AND ended = 0',
            [context.senderId, resource.id, resource.id, context.senderId])

        if(dup[0])
            return context.send('❌ | Предложение на проведение сделки с данным пользователем уже было отправлено')

        const key = md5(context.senderId + resource.id + "trade" + getRandomId())
        await mysql.execute('INSERT INTO `trades`(`trade_key`,`seller`, `buyer`, `amount`, `type`) VALUES (?, ?, ?, ?, ?)',
            [key, context.senderId, resource.id, -1, -1])

        context.send('✅ | Предложение провести сделку отправлено')
        try{
            require('../index').vk.api.messages.send({
                message: `❓ | Вы согласны на проведение сделки с пользователем @id${context.senderId}?`,
                keyboard: Keyboard.builder().inline()
                    .textButton({
                        label: 'Да',
                        payload: `trade:yes:${key}`,
                        color: Keyboard.POSITIVE_COLOR
                    })
                    .textButton({
                        label: 'Нет',
                        payload: `trade:no:${key}`,
                        color: Keyboard.NEGATIVE_COLOR
                    }),
                random_id: 0,
                user_id: resource.id
            })
        }
        catch (e) {}
    } else {
        let seller = context.question('💼 | Введи ID или никнейм продавца (из ВКонтакте)')
    }
};

module.exports.runPayload = async (context) => {
    const delim = context.messagePayload.split(':')
    const trade = await mysql.execute('SELECT * FROM `trades` WHERE `trade_key` = ? and ended = 0 and viewed = 0',
        [delim[2]])

    if(!trade[0])
        return context.reply('❌ | Сделка не найдена. Видимо, предложение уже истекло')

    await mysql.execute('UPDATE `trades` SET `viewed`=1 WHERE trade_key = ?', [trade[0].trade_key])

    switch (delim[1]){
        case 'yes':
            let garant = await context.question({
                message: '🎲 | Напиши ID или юзернейм гаранта (из ВКонтакте):',
                keyboard: Keyboard.builder().inline()
                    .textButton({
                        label: '💥 Случайный гарант',
                        payload: 'random'
                    })
            })

            let userGarant = null

            if(!garant.payload){
                const resource = await resolveResource({
                    api,
                    resource: garant.text
                })
                if (!resource || !resource.id)
                    return context.send('❌ | Неверный айди или ник')
                const us_get = await mysql.execute('SELECT * FROM users WHERE vk = ?', [resource.id])
                if (!us_get[0])
                    return context.send('❌ | Пользователь не найден')

                const gInfo = await mysql.execute('SELECT * FROM garants WHERE vk = ?',
                    [resource.id])

                if(!gInfo[0])
                    return context.send('❌ | Пользователь не является подтвержденным гарантом')
            }
            else if(garant.payload && (garant.payload != 'skip' && garant.payload != 'random')){
                context.send('❌ | Отмена..')
            }
            else if(garant.payload == 'random') {
                userGarant = (await mysql.execute('SELECT * FROM garants ORDER BY rand() LIMIT 1'))[0]
                let garant = await context.question({
                    message: `🥠 | Гарант: @id${userGarant.vk} (${userGarant.username}). Его комиссия составит ${userGarant.comka}% от сделки`,
                    keyboard: Keyboard.builder().inline()
                        .textButton({
                            label: '👌 Всё хорошо',
                            payload: 'ok',
                            color: Keyboard.POSITIVE_COLOR
                        })
                        .row()
                        .textButton({
                            label: '🙅‍♂️ Отменить сделку',
                            payload: 'notok',
                            color: Keyboard.NEGATIVE_COLOR
                        })
                })
            }

            break
        case 'no':
            context.send({
                message: `❌ | Сделка отменена`
            })

            require('../index').vk.api.messages.send({
                message: `❓ | Вы согласны на проведение сделки с пользователем @id${context.senderId}?`,
                keyboard: Keyboard.builder().inline()
                    .textButton({
                        label: 'Да',
                        payload: `trade:yes:${key}`,
                        color: Keyboard.POSITIVE_COLOR
                    })
                    .textButton({
                        label: 'Нет',
                        payload: `trade:no:${key}`,
                        color: Keyboard.NEGATIVE_COLOR
                    }),
                random_id: 0,
                user_id: resource.id
            })

            break
    }
}