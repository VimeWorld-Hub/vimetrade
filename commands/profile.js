const {Keyboard} = require('vk-io')

const mysql = require('../index').mysql
const messages = require('../libs/messages')
const config = require('../config')

const vk = require('../index').vk
const md5 = require("md5")
const generator = require('generate-password')
const axios = require("axios")


module.exports.info = {
    name: 'profile',
    usage: "",
    aliases: 'profile, me, я',
    description: 'твой профиль',
    permission: 1,
    enabled: true,
    help: true
};

module.exports.run = async (context) => {
    const u = await mysql.execute(`SELECT * FROM users WHERE vk = ?`, [context.senderId])
    const sells = await mysql.execute(`SELECT * FROM sells WHERE vk = ?`, [context.senderId])
    const user_name = await vk.api.users.get({user_id: context.message.from_id})

    context.reply({
        message: `●━━━━∘ ${user_name[0].first_name} ${user_name[0].last_name} ∘━━━━●`
            + `\n\n💎 Статус: ${await messages.getRank(u[0].status)}`
            + `\n👨‍💻 Никнейм: ${(u[0].username == '-1') ? 'не привязан' : u[0].username}`
            + `\n\n💶 Рублей: ${u[0].rubs}`
            + `\n💸 Вимеров: ${u[0].vimers}`
            + `\n\n🛒 Активных объявлений: ${sells.length}`
            + `\n\n`
            + `\n`,
        disable_mentions: 1,
        dont_parse_links: 1,
        keyboard: Keyboard.builder()
            .inline()
            .textButton({
                label: "📥 Пополнить баланс",
                payload: `profile:addbalance`,
                color: Keyboard.POSITIVE_COLOR
            })
            .textButton({
                label: "📤 Вывести деньги",
                payload: `profile:withdrawal`,
                color: Keyboard.NEGATIVE_COLOR
            })
            .row()
            .textButton({
                label: "📧 Активные предложения",
                payload: `unsell`,
                color: Keyboard.PRIMARY_COLOR
            })
            .textButton({
                label: "📭 История операций",
                payload: `history`,
                color: Keyboard.PRIMARY_COLOR
            })
    })
}

module.exports.runPayload = async (context) => {
    const delim = context.messagePayload.split(":")
    const user = await mysql.execute('SELECT * FROM users WHERE vk = ?', [context.senderId])

    switch (delim[1]) {
        case 'pays_methods':
            return context.reply('💳 Оплата по карте:\n● Комиссия: 5%\n● Лимиты: 75-70000 RUB\n\n📳 Qiwi:\n ● Комиссия: 4%\n● Лимиты: 50-15000 RUB\n\n🕎 YooMoney:\n ● Комиссия: 4%\n● Лимиты: 15-15000 RUB'
                    + '\n\n🌀 FKWallet:\n● Комиссия: 0%\n● Лимиты: 10-300000 RUB')
                    + '\n\n🥸 Криптовалюты:\n● Комиссия: 0.5%\n● Лимиты: ~500$ (для каждой монеты свой)'
        case 'withdrawal':
            const ans = await context.question({
                    message: `📥 | Выбери, пожалуйста, что именно ты хочешь вывести`,
                    keyboard: Keyboard.builder()
                        .inline()
                        .textButton({
                            label: "Рубли",
                            payload: `rubs`,
                            color: Keyboard.SECONDARY_COLOR
                        })
                        .textButton({
                            label: "Вимеры",
                            payload: `vimers`,
                            color: Keyboard.SECONDARY_COLOR
                        })
                        .row()
                        .textButton({
                            label: "Отмена",
                            payload: `cancel`,
                            color: Keyboard.PRIMARY_COLOR
                        })
                }
            );
            if (!ans.payload) {
                return context.reply('❌ | Операция отменена..')
            }

            if (ans.payload === 'vimers') {
                let vimers = await context.question({
                        message: '💳 | Введи, пожалуйста, сумму в вимерах, которую хочешь вывести'
                    }
                );
                vimers = vimers.text

                if (!await messages.isValidSum(vimers))
                    return context.send('❌ | Сумма указана неверно')

                if (vimers < 15)
                    return context.send('❌ | Сумма должна быть больше 14')

                if (vimers > user[0].vimers)
                    return context.send('❌ | Недостаточно средств на балансе')

                let username = await context.question({
                        message: '💳 | Введи, пожалуйста, ник на который должны зачислиться вимеры'
                    }
                );
                username = username.text

                if (/\w/.test(username) === false)
                    return context.send('❌ | Ник введен неверно')

                let ok = await context.question({
                        message: `🛒 Вывести ${await messages.plurals(vimers - messages.getComm(vimers), "вимер", "вимера", "вимеров")}?\n└ Комиссия: ${await messages.plurals(messages.getComm(vimers), "вимер", "вимера", "вимеров")}`,
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

                if (ok.payload !== 'yes') return context.send('❌ | Операция отменена..')
                try {
                    const res = await axios.get(`${config.vimeworld.vimeapi_domen}/giveVimers.php?token=${config.vimeworld.vimeapi_token}&to=${username}&vimers=${vimers - messages.getComm(vimers)}`)
                    const comka = await axios.get(`${config.vimeworld.vimeapi_domen}/giveVimers.php?token=${config.vimeworld.vimeapi_token}&to=CharkosOff&vimers=${messages.getComm(vimers)}`)

                    if (res.data.code != 1 && comka.data.code != 1)
                        return context.reply(`❌ | Что-то пошло не так, вимеры не будут выведены..`)

                    await mysql.execute('UPDATE `users` SET `vimers`=? WHERE vk = ?', [Number(user[0].vimers) - Number(vimers), context.senderId])
                    context.send({
                        message: `✅ | Вимеры успешно выведены. Оставь, пожалуйста, отзыв`,
                        keyboard: Keyboard.builder()
                            .inline()
                            .urlButton({
                                label: "Оставить отзыв",
                                url: "https://vk.com/topic-207749865_48239853"
                            })
                    })
                } catch (e) {
                    context.send(`❌ | При выводе вимеров произошла ошибка..\n\n${e}`)
                }
            } else if (ans.payload === 'rubs') {
                let rubs = await context.question({
                        message: '💳 | Введи, пожалуйста, сумму в рублях, которую ты хочешь вывести'
                    }
                );
                if (rubs.payload) return context.send('❌ | Операция отменена..')
                rubs = rubs.text

                if (!await messages.isValidSum(rubs))
                    return context.send('❌ | Сумма указана неверно')

                if (rubs < 2)
                    return context.send('❌ | Вывод начинается от двух рублей')

                if (user[0].rubs < rubs)
                    return context.send('❌ | Недостаточно средств на балансе')

                let to = await context.question({
                        message: '💳 | Введи, пожалуйста, номер телефона, который привязан к QIWI для вывода (например +79687584492), или адрес ЮMoney'
                    }
                );
                if (to.payload) return context.send('❌ | Операция отменена..')

                let ok = await context.question({
                        message: `🛒 | Вывести ${await messages.plurals(rubs - messages.getComm(rubs), "рубль", "рубля", "рублей")}?\n└ Комиссия: ${await messages.plurals(messages.getComm(rubs), "рубль", "рубля", "рублей")}`,
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

                if (ok.payload !== 'yes') return context.send('❌ | Операция отменена..')
                await mysql.execute('UPDATE `users` SET `rubs`=? WHERE vk = ?', [Number(user[0].rubs) - Number(rubs), context.senderId])

                let summa = rubs - messages.getComm(rubs)
                let comm = messages.getComm(rubs)

                if (user[0].status == '3') {
                    comm = '0 (выводит Администратор)'
                    summa = rubs
                }

                context.send('✅ | Средства будут выведены в течение 24-х часов')
                await vk.api.messages.send({
                    user_id: 584536789,
                    random_id: 0,
                    message: `Новый запрос на вывод:\nКошелек: ${to.text}\nСумма: ${summa}\nКомиссия: ${comm}`,
                    keyboard: Keyboard.builder()
                        .inline()
                        .textButton(({
                            label: "Вывел",
                            payload: `successPayment:${context.senderId}`
                        }))
                })
            } else {
                return context.reply('❌ | Операция отменена..')
            }
            break
        case 'addbalance':
            const answer = await context.question({
                    message: `📥 | Выбери, пожалуйста, тип пополнения`,
                    keyboard: Keyboard.builder()
                        .inline()
                        .textButton({
                            label: "Рубли",
                            payload: `rubs`,
                            color: Keyboard.SECONDARY_COLOR
                        })
                        .textButton({
                            label: "Вимеры",
                            payload: `vimers`,
                            color: Keyboard.SECONDARY_COLOR
                        })
                        .row()
                        .textButton({
                            label: "Отмена",
                            payload: `cancel`,
                            color: Keyboard.PRIMARY_COLOR
                        })
                }
            );

            if (answer.payload === "vimers") {
                let from = user[0].username

                if(from == '-1')
                    return context.send({
                        message: '❌ | Для пополнения счёта необходимо привязать аккаунт VimeWorld',
                        keyboard: Keyboard.builder()
                            .inline()
                            .textButton({
                                label: 'Привязать никнейм',
                                payload: 'link'
                            })
                    })

                if (from.toLowerCase() === 'vimetrade_bot')
                    return context.send('❌ | Перевод со служебного ника невозможен')

                context.reply(`💳 | Переведи с привязанного аккаунта (${user[0].username}) необходимое количество вимеров на ник VimeTrade_Bot`, {
                    keyboard: Keyboard.builder()
                        .inline()
                        .urlButton({
                            label: "Перевести",
                            url: "https://vk.cc/c6WnTe"
                        })
                })
                return
            } else if (answer.payload === "cancel") {
                return context.send(`❌ | Операция отменена..`)
            } else {
                let rubs = await context.question({
                        message: '💳 | Введи, пожалуйста, сумму на которую хочешь пополнить свой баланс'
                    }
                );
                if (rubs.payload)
                    return context.reply('❌ | Операция отменена..')
                rubs = rubs.text

                if (!await messages.isValidSum(rubs))
                    return context.send('❌ | Сумма пополнения указана неверно')

                if (rubs <= 2)
                    return context.send('❌ | Сумма пополнения должна быть больше двух')

                const bill = md5(generator.generate({
                    length: 32,
                    numbers: true
                }))


                try {
                    await mysql.execute(
                        'INSERT INTO `orders_rub`(`id`, `vk`, `amount`) VALUES (?, ?, ?)',
                        [bill, context.senderId, rubs]
                    )

                    const link = messages.getPayment(rubs, bill)

                    const vkcc = await require('../index').vk.api.utils.getShortLink({
                        url: link,
                        private: 0
                    })

                    context.reply({
                        message: `💳 | Хорошо. Если ты готов продолжить и пополнить свой баланс, то нажми на кнопку «Пополнить», а после оплаты нажми на кнопку «Найти платеж»`,
                        keyboard: Keyboard.builder()
                            .inline()
                            .urlButton({
                                url: vkcc.short_url,
                                label: "Пополнить"
                            })
                            .row()
                            .textButton({
                                label: "Способы оплаты",
                                payload: `${this.info.name}:pays_methods`,
                                color: Keyboard.PRIMARY_COLOR
                            })
                    })
                } catch (e) {
                    context.reply({
                        message: '🚫 | При выполнении операции произошла ошибка. Пожалуйста, напишите Администрации бота'
                    })
                    console.error(e)
                }
            }
            break
        default:
            this.run(context)
    }
}