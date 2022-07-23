const mysql = require('../index').mysql
const messages = require('../libs/messages')
const config = require('../config')
const axios = require("axios")

const { API, resolveResource, Keyboard} = require('vk-io')
const api = new API({
    token: config.vimpy
});


module.exports.info = {
    name: 'apanel',
    usage: "",
    aliases: 'apanel, vimetrade, апанель',
    description: 'админ-панель (тестовая)',
    permission: 3,
    enabled: true,
    help: true
};

module.exports.run = async (context, delim) => {
    if (!delim) delim = context.text.split(' ')


    if(!delim[1]){
        return context.reply({
            message: `Доступные операции:`,
            keyboard: Keyboard.builder()
                .inline()
                .textButton({
                    label: "Всего денег",
                    payload: this.info.name + ':' + `totalmoney`,
                    color: Keyboard.PRIMARY_COLOR
                })
                .textButton({
                    label: "Пополнения вимеров",
                    payload: this.info.name + ':' + `getoperations`,
                    color: Keyboard.PRIMARY_COLOR
                })
                .row()
                .textButton({
                    label: "Текущие задачи",
                    payload: this.info.name + ':' + `gettasks`,
                    color: Keyboard.PRIMARY_COLOR
                })
                .row()
                .textButton({
                    label: "Выключить бота",
                    payload: this.info.name + ':' + `botdisable`,
                    color: Keyboard.NEGATIVE_COLOR
                })
                .textButton({
                    label: "Включить бота",
                    payload: this.info.name + ':' + `botenable`,
                    color: Keyboard.POSITIVE_COLOR
                })
        })
    }

    const list = ['']
    let get;

    switch (delim[1]){
        case 'totalmoney':
            const totalvim = await mysql.execute('SELECT SUM(vimers) FROM users')
            const totalrub = await mysql.execute('SELECT SUM(rubs) FROM users')

            return context.reply(`Вимеров в боте: ${totalvim[0]['SUM(vimers)']}\nРублей в боте: ${Math.floor(totalrub[0]['SUM(rubs)'])}`)
        case 'getoperations':
            get = await mysql.execute('SELECT * FROM `operations_log` ORDER BY `operations_log`.`id` DESC LIMIT 5')

            for(const operation of get){
                list.push(`{${operation.id}} @id${operation.vk} (${operation.username}). Вимеры: ${operation.vimers}`)
            }

            return context.reply('📩 Последние операции (Вимеры)' + list.join('\n● '))
        case 'gettasks':
            const tasks = ['']

            for(const task of require('../index').tasks.tasks){
                tasks.push(`${task[1].info.name} - ${task[1].info.update} - ${task[1].info.enabled}`)
            }

            return context.reply(`🧨 Текущие задачи: ${tasks.join('\n')}`)
        case 'botdisable':
            await mysql.execute('UPDATE `bot` SET `enable`=0')
            return context.reply(`теперь бот доступен только админам`)
        case 'botenable':
            await mysql.execute('UPDATE `bot` SET `enable`=1')
            return context.reply(`теперь бот доступен всем`)
    }
}

module.exports.runPayload = async (context) => {
    this.run(context, context.messagePayload.split(':'))
}