const mysql = require('../index').mysql
const {Keyboard} = require("vk-io")

module.exports.info = {
    name: 'sells',
    usage: "",
    aliases: 'sells, продажи',
    description: 'актуальные предложения на данный момент',
    permission: 1,
    enabled: true,
    help: true
};

module.exports.run = async (context) => {
    const sells = await mysql.execute('SELECT * FROM `sells` WHERE vk != ? LIMIT 20', [context.senderId])

    if(!sells[0]) return context.reply({
        message: "🛒 | Маркет пуст",
        keyboard: Keyboard.builder()
            .inline()
            .textButton({
                label: "👩‍💻 Мои объявления",
                payload: "unsell"
            })
    })

    const list = ['']

    for(const sell of sells){
        list.push(`{${sell.id}} Продавец: @id${sell.vk}. Курс: ${sell.rub} руб. Вимеров в наличии: ${sell.amount}`)
    }

    const header = (context.messagePayload) ? '' : '🛒 | Активные предложения:\n'

    context.reply({
        message: header + list.join('\n● ') + `\n\n🛍 | Приобрести вимеры можно командой /buy <айди объявления>`,
        keyboard: Keyboard.builder()
            .inline()
            .textButton({
                label: "👩‍💻 Мои объявления",
                payload: "unsell"
            })
    })
};

module.exports.runPayload = async (context) => {
    this.run(context)
};