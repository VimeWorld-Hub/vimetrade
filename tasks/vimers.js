const axios = require("axios");
const config = require('../config')
const security = require('../index').group
const mysql = require('../index').mysql
const messages = require("../libs/messages");

const vk = require('../index').vk
let status = false

module.exports.info = {
    name: 'vimers_operations',
    update: 5000,
    enabled: true
};

module.exports.run = async () => {
    try{
        if(!status) console.log(`[VimeTrade] Задача \"${module.exports.info.name}\" запущена`)
        status = true

        const rs = await axios.get(`${config.vimeworld.vimeapi_domen}/getop.php?token=RMuVHgDRDNNDxNzdk847fJ2JbZrZuLSs`)
        for(const op of rs.data){
            const is = await mysql.execute('SELECT * FROM operations_log WHERE username = ? and date = ?', [op.username, op.date])
            if(is[0] || Number(op.vimers) < 1) return
            const user = await mysql.execute('SELECT * FROM `users` WHERE username = ?', [op.username])
            if(!user[0]) return

            await mysql.execute('INSERT INTO operations_log (vk, username, date, vimers) VALUES(?, ?, ?, ?)', [user[0].vk, op.username, op.date, op.vimers])
            await mysql.execute('UPDATE `users` SET `vimers`=? WHERE vk = ?', [Number(user[0].vimers) + Number(op.vimers), user[0].vk])
            try{
                await vk.api.messages.send({
                    user_id: user[0].vk,
                    random_id: 0,
                    message: `🔥 | Баланс пополнен на ${await messages.plurals(op.vimers, "вимер", "вимера", "вимеров")}`
                })
            }
            catch (e) {}
            await security.sendToAllAdmins(`🔥 | @id${req.query.us_login} пополнил счет на ${await messages.plurals(op.vimers, "вимер", "вимера", "вимеров")}`)
        }
    }
    catch (e) {
        console.error(e + `\nTask: ${module.exports.info.name}`)
    }
}