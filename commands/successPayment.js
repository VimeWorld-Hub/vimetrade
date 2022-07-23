const {vk} = require("../index");
const {Keyboard} = require("vk-io");

module.exports.info = {
    name: 'successPayment',
    usage: "",
    aliases: 'successPayment',
    description: 'служебная команда по выводу средств',
    permission: 3,
    enabled: true,
    help: false
};

module.exports.run = async (context, delim) => {
    if(!context.messagePayload) return context.reply('Не юзай это, пожалуйста')
    if (!delim) delim = context.text.split(':')
    try {
        await vk.api.messages.send({
            user_id: delim[1],
            random_id: 0,
            message: `✅ | Средства были успешно выведены`,
            keyboard: Keyboard.builder()
                .inline()
                .urlButton({
                    label: "Оставить отзыв",
                    url: "https://vk.com/topic-207749865_48239853"
                })
        })

        context.reply(`✅ Отправлено`)
    } catch (e) {
        console.error(e)

        context.reply(`📵 Какая-то херня, видимо чел запретил отправлять сообщения`)
    }
};

module.exports.runPayload = async (context) => {
    const delim = context.messagePayload.split(':')
    this.run(context, delim)
}