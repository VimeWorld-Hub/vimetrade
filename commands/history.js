const {Keyboard} = require('vk-io')
const config = require('../config')
const messages = require("../libs/messages");
const mysql = require('../index').mysql

module.exports.info = {
    name: 'history',
    usage: "",
    aliases: 'history, история',
    description: 'список операций, связанных с пополнением баланса',
    permission: 1,
    enabled: true,
    sponsor: [],
    help: true
};

module.exports.run = async (context, delim) => {
    if(!delim) delim = null

    if(delim && delim[1]){
        switch (delim[1]){
            case 'rub':
                const rub = await mysql.execute('SELECT * FROM orders_rub WHERE vk = ? and pay = 1 LIMIT 20', [context.senderId])
                if(rub.length <= 0)
                    return context.reply('❌ | У тебя нет пополнений в рублях')

                const ls = ['']
                for(const op of rub){
                    ls.push(`${await messages.plurals(op.rub, "рубль", "рубля", "рублей")}`)
                }

                return context.reply(ls.join('\n● '))
            case 'vimers':
                const vimers = await mysql.execute('SELECT * FROM operations_log WHERE vk = ? LIMIT 20', [context.senderId])
                if(vimers.length <= 0)
                    return context.reply('❌ | У тебя нет пополнений в вимерах')

                const list = []
                for(const op of vimers){
                    list.push(`${await messages.plurals(op.vimers, "вимер", "вимера", "вимеров")}`)
                }

                list.push('')
                list.reverse()

                return context.reply(list.join('\n● '))
        }
    }

    context.reply({
        message: `🛒 | Выбери тип пополнения:`,
        keyboard: Keyboard.builder()
            .inline()
            .textButton({
                label: 'Рубли',
                payload: 'history:rub'
            })
            .textButton({
                label: 'Вимеры',
                payload: 'history:vimers'
            })
    })
};

module.exports.runPayload = async (context) => {
    this.run(context, context.messagePayload.split(':'))
};