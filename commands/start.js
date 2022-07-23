const mysql = require('../index').mysql
const config = require("../config")
const messages = require('../libs/messages')

const vk = require('../index').vk

module.exports.info = {
    name: 'start',
    usage: "",
    aliases: 'start, старт',
    description: 'создание аккаунта',
    permission: 1,
    enabled: true,
    help: false
};

module.exports.run = async (context) => {
    const u = await mysql.execute(`SELECT * FROM users WHERE vk = ?`, [context.senderId])
    if (u.length === 1 && u[0] && u[0]['id']) {
        return context.reply({
            message: `🤖 | Клавиатура выслана вновь`,
            keyboard: await (new messages.VKeyboard).getDefaultKeyboard()
        })
    }

    try {
        const resource = await vk.api.users.get({
            user_ids: context.senderId,
            fields: ['sex']
        })

        await context.send({
            message: `✋ Привет, ${resource[0].first_name}. Ты ${resource[0].sex == 2 ? 'выбрал' : 'выбрала'} лучшего бота для покупки и продажи вимеров`
                + `\n\n📍/profile - твой профиль | /help - доступные команды`
                + `\n📍 Подробная информация: https://vk.com/@vwtrade-podrobnayainformaciya`
                + `\n\nЕсли у тебя возникнут какие-либо вопросы, пожалуйста, обратись в нашу поддержку:`
                + `\n👨‍💼 Агент Поддержки #1: https://vk.com/kpacab4ekmtl`
                + `\n👨‍💼 Агент Поддержки #2: https://vk.com/id481372552`
                + `\nПоддержка работает с 13:00 до 22:00 [МСК]`
                + `\n\n📁 Отзывы: https://vk.com/topic-207749865_48239853`,
            keyboard: await (new messages.VKeyboard).getDefaultKeyboard()
        })
    } catch (e) {
        if (e) console.error(e)
        context.reply({
            message: `🛠 | Сообщение съели енотики`,
            keyboard: await (new messages.VKeyboard).getDefaultKeyboard()
        })
    }
};

module.exports.runPayload = async (context) => {
    this.run(context)
};