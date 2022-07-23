const mysql = require('../index').mysql
const fs = require('fs')
const config = require('../config')

module.exports.info = {
    name: "Листнер новых сообщений"
};

const keyboard_version = 3

module.exports.run = async (context) => {
    if (config.bot.debug) console.log(context)
    if (context.conversationMessageId === 1 || context.conversationMessageId === 2) return require(`../commands/start`).run(context)

    const isEnable = await mysql.execute('SELECT `enable` FROM bot')
    const user = await mysql.execute('SELECT * FROM users WHERE vk = ?', [context.senderId])
    if(isEnable[0].enable == '0' && user[0].status != 3)
        return context.reply('😥 | Бот временно отключен. Попробуйте чуть позже')

    if (context.messagePayload)
        return new Buttons().execute(context)
    else
        return new Commands().execute(context)
};


class User {
    async get(id) {
        const u = await mysql.execute(`SELECT * FROM users WHERE vk = ?`, [id])
        if(u[0])
            return u
        else
            await this.add(id)
            return await mysql.execute(`SELECT * FROM users WHERE vk = ?`, [id])
    }

    async add(id) {
        await mysql.execute(`insert into users(vk) values(?)`, [id])
    }
}

const USER = new User()

class Buttons {
    async execute(context) {
        try {
            const cmd = context.messagePayload.command || context.messagePayload.text || context.messagePayload || context.messagePayload.user_command || ""
            const delim = cmd.split(':')

            const user = await USER.get(context.senderId)

            if(user[0].keyboard != keyboard_version){
                await mysql.execute('UPDATE `users` SET `keyboard`=? WHERE vk = ?', [keyboard_version, context.senderId])
                return require(`../commands/start`).run(context)
            }


            fs.readdir("./commands", (err, files) => {
                if (err) return console.error(err);

                files.forEach((file) => {
                    if (!file.endsWith(".js")) return;

                    let command = require(`../commands/${file}`);
                    let aliases = command.info.aliases.split(", ");

                    for (let i = 0; i < aliases.length; i++) {
                        if (delim[0].toLowerCase() === aliases[i].toLowerCase() && command.info.enabled)
                            if (command.info.permission <= user[0].status) return command.runPayload(context)
                            else return context.reply(`🔒 У вас недостаточно прав для этого действия`)
                    }
                });
            });
        } catch (e) {
            console.error(e)
        }
    }
}

class Commands {
    async execute(context) {
        if (context.isChat) return
        if (!context.text) return
        const delim = context.text.split(' ')

        try {
            const user = await USER.get(context.senderId)

            if(user[0].keyboard != keyboard_version){
                await mysql.execute('UPDATE `users` SET `keyboard`=? WHERE vk = ?', [keyboard_version, context.senderId])
                return require(`../commands/start`).run(context)
            }


            if (delim[0].split("")[0] !== '/') return;

            fs.readdir("./commands", (err, files) => {
                if (err) return console.error(err);

                files.forEach((file) => {
                    if (!file.endsWith(".js")) return;

                    let command = require(`../commands/${file}`);
                    let aliases = command.info.aliases.split(", ");

                    for (let i = 0; i < aliases.length; i++) {
                        if (delim[0].toLowerCase() === '/' + aliases[i] && command.info.enabled) {
                            if (command.info.permission <= user[0].status) return command.run(context)
                            else return context.reply(`🔒 У вас недостаточно прав для этого действия`)
                        }
                    }
                })
            })
        } catch (e) {
            console.error(e)
            context.reply(`🔎 При выполнении команды \"${delim[0]}\" произошла ошибка :c`)
        }
    }
}