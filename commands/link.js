const {Keyboard} = require("vk-io")
const axios = require('axios')
const mysql = require('../index').mysql
module.exports.info = {
    name: 'link',
    usage: "",
    aliases: 'link, привязать, add, добавить',
    description: 'привязать аккаунт VimeWorld',
    permission: 1,
    enabled: true,
    help: true
}

module.exports.run = async (context) => {
    const type = await context.question({
        message: '🤖 | Отправь, пожалуйста, свой Auth-токен:',
        keyboard: Keyboard.builder()
            .inline()
            .urlButton({
                label: 'Получение токена',
                url: 'https://vk.com'
            })
    })

    let array = type.text.match(/((https:\/\/|http:\/\/)(www\.)?api\.vime\.world\/web\/token\/)?([a-zA-Z0-9]+$)/)
    let token = array[4] || array[0]

    try{
        const res = await axios.get(`https://api.vimeworld.ru/misc/token/${token}`)
        if(!res.data.valid)
            return context.send('❌ | Токен авторизации недействительный. Попробуй ещё раз')

        const username = res.data.owner.username

        await mysql.execute('UPDATE `users` SET `username` = ? WHERE vk = ?',
            [username, context.senderId])

        context.send(`✅ | Аккаунт {ID${res.data.owner.id}} ${username} привязан!`)
    }
    catch (e) {
        context.send('❌ | Что-то пошло не так')
        console.error(e)
    }
}

module.exports.runPayload = async (context) => {
    this.run(context)
}