class Sender {
    noArguments(context, delim, info) {
        context.reply(`❌ | Команда использована неверно\n\nИспользуй, пожалуйста, команду так: ${delim[0]} ${info.usage}`)
    }

    error(context, message) {
        context.reply(`❌ | ${message}`)
    }

    success(context, message) {
        context.reply(`✅ | ${message}`)
    }
}

module.exports = {Sender}