const fs = require('fs')
const mysql = require('../index').mysql
const Mess = require('../libs/messages')

module.exports.info = {
    name: 'help',
    usage: "",
    aliases: 'help, помощь',
    description: 'полный список команд',
    permission: 1,
    enabled: true,
    sponsor: [],
    help: false
};

module.exports.run = async (context) => {
    fs.readdir("./commands", async (err, files) => {
        const u = await mysql.execute(`SELECT * FROM users WHERE vk = ?`, [context.senderId])
        if(err) return console.error(err);
        const commands = ['']
        const admin = ['']
        files.forEach((file) => {
            if(!file.endsWith(".js")) return;

            let command = require(`./${file}`);

            if(command.info.enabled && command.info.help && command.info.permission === 1) commands.push(`${command.info.name}${(command.info.usage.split('').length > 1) ? ' ' + command.info.usage : ''} - ${command.info.description}`)
            else if(command.info.enabled && command.info.help && u[0].status >= command.info.permission && !context.isChat) admin.push(`${command.info.name}${(command.info.usage.split('').length > 1) ? ' ' + command.info.usage : ''} - ${command.info.description}`)
        })

        const header = (context.messagePayload)
            ? ''
            : 'Список моих команд:'
        const body = commands.join(`\n● /`)
            + admin.join(`\n◎ /`)
        const footer = ``

        const mess = new Mess.Message(header, body, footer)

        context.reply({
            message: await mess.get()
        })
    })
};

module.exports.runPayload = async (context) => {
    this.run(context)
};