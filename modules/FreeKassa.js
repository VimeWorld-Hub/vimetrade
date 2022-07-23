const express = require("express")
const md5 = require("md5");
const config = require("../config")
const messages = require("../libs/messages");

class FreeKassa{
    constructor(port, mysql) {
        this.port = port
        this.mysql = mysql
        this.secutiry = require('../index').group
        this.vk = require('../index').vk

        this.app = express()
        this.app.set('trust proxy', true)

        this.start()
    }

    async start(){
        await this.methods()
        this.app.listen(this.port, () => {
            console.log(`[VimeTrade] Сервис FreeKassa: http://localhost:${this.port}`)
        })
    }

    methods(){
        this.app.get('/', (req, res) => {
            res.send('Hello. There\'s nothing here')
        })

        this.app.get('/freekassa/notify', async (req, res) => {
            const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.headers['x-real-ip']
            const sign = md5(`${config.freekassa.id}:${req.query.AMOUNT}:${config.freekassa.secret_2}:${req.query.MERCHANT_ORDER_ID}`)
            const order = await this.mysql.execute('SELECT * FROM orders_rub WHERE id = ? and vk = ? and pay = 0', [req.query.MERCHANT_ORDER_ID, req.query.us_login])
            const normalIp = ['168.119.157.136', '168.119.60.227', '138.201.88.124', '178.154.197.79']

            if(!normalIp.includes(ip)) return res.send('too many hackers')
            if(sign != req.query.SIGN) return res.send('wrong sign')
            if(!order[0]) return res.send('invalid order')

            const user = await this.mysql.execute('SELECT * FROM users WHERE vk = ?', [req.query.us_login])
            if(!user[0]) return res.send('Invalid user')

            const newBalance = Number(user[0].rubs) + Number(req.query.AMOUNT)

            await this.mysql.execute('UPDATE `orders_rub` SET `pay`=1 WHERE id = ?', [req.query.MERCHANT_ORDER_ID])
            await this.mysql.execute('UPDATE `users` SET `rubs`=? WHERE vk = ?', [newBalance, req.query.us_login])
            try{
                await this.vk.api.messages.send({
                    user_id: req.query.us_login,
                    random_id: 0,
                    message: `🔥 | Баланс пополнен на ${await messages.plurals(req.query.AMOUNT, "рубль", "рубля", "рублей")}`
                })
            }
            catch (e) {}

            await this.secutiry.sendToAllAdmins(`🔥 | @id${req.query.us_login} пополнил счет на ${req.query.AMOUNT} руб.\nНовый баланс: ${newBalance}`)

            res.send('OK')
        })

        this.app.get('/freekassa/payment/success', (req, res) => {
            res.redirect('https://vk.com/im?sel=-207749865')
        })

        this.app.get('/freekassa/payment/fail', (req, res) => {
            res.redirect('https://vk.com/im?sel=-207749865')
        })
    }
}

module.exports = { FreeKassa }