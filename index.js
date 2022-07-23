const config = require('./config')

const {VK} = require('vk-io')
const {QuestionManager} = require('vk-io-question')
const {Group} = require('./listeners/group')
const {MySQL} = require('./modules/MySQL')
const {Sender} = require('./modules/Sender')
const {Manager} = require('./modules/TaskManager')
const {FreeKassa} = require('./modules/FreeKassa')

module.exports.vk = new VK({
    token: (config.bot.debug === true)
        ? config.bot.token.debug
        : config.bot.token.release,
    apiLimit: 20,
    apiMode: "sequential"
})
module.exports.mysql = (config.bot.debug === true)
    ? new MySQL(config.mysql.debug.host, config.mysql.debug.user, config.mysql.debug.password, config.mysql.debug.database)
    : new MySQL(config.mysql.release.host, config.mysql.release.user, config.mysql.release.password, config.mysql.release.database)
module.exports.sender = new Sender()
module.exports.group = new Group(config.bot.security_bot)
module.exports.freekassa = new FreeKassa(4433, this.mysql)
module.exports.tasks = new Manager()

this.vk.updates.use(new QuestionManager().middleware);
this.vk.updates.on('message_new', (context) => {
    require('./listeners/message_new').run(context)
})

this.vk.updates.on('group_leave', (context) => {
    this.group.leave(context)
})

this.vk.updates.on('group_join', (context) => {
    this.group.join(context)
})

this.vk.updates.start().catch(console.error)