const { Keyboard } = require('vk-io')
const axios = require("axios")
const config = require('../config')
const md5 = require('md5')

class Message{
    constructor(header, body, footer) {
        this.header = (header) ? header : '';
        this.body = (body) ? body : '';
        this.footer = (footer) ? footer : '';
    }

    async get(){
        return `${this.header + this.body + this.footer}`
    }
}

class VKeyboard{
    async getDefaultKeyboard(){
        return Keyboard.builder()
            .textButton({
                label: "💡 Помощь",
                payload: "help",
                color: Keyboard.SECONDARY_COLOR
            })
            .row()
            .textButton({
                label: "💼 Маркет",
                payload: "sells",
                color: Keyboard.SECONDARY_COLOR
            })
            .textButton({
                label: "👩🏻‍💻 Мой профиль",
                payload: "profile",
                color: Keyboard.SECONDARY_COLOR
            })
            /*
            .row()
            .textButton({
                label: "📓 Дополнительно",
                payload: "staff",
                color: Keyboard.PRIMARY_COLOR
            })
            .textButton({
                label: "⚙ Настройки",
                payload: "streams",
                color: Keyboard.PRIMARY_COLOR
            });*/
    }
}

async function plurals(n, form1, form2, form3){
    return n + " " + await plurals2(n, form1, form2, form3);
}

async function plurals2(n, form1, form2, form3){
    if (n == 0)
        return form3;
    n = Math.abs(n) % 100;
    if (n > 10 && n < 20)
        return form3;
    n %= 10;
    if (n > 1 && n < 5)
        return form2;
    if (n == 1)
        return form1;
    return form3;
}

/** Возвращает ранг в понятном юзеру формате **/
async function getRank(rank){
    switch (rank){
        case 1:
            return 'Пользователь'
        case 2:
            return 'Бета-пользователь'
        case 3:
            return 'Администратор'
    }
}

/** Возвращает комиссию при выводе средств **/
function getComm(sum){
    return Math.ceil(sum * 0.05)

    let com = 0.04

    if(sum < 100){
        com = 0.07
    }
    else if(sum < 200){
        com = 0.06
    }
    else if(sum < 300){
        com = 0.05
    }

    return Math.ceil(sum * com)
}

/** Возвращает, правильно ли введено число **/
async function isValidSum(number = ""){
    const symbols = number.split('')

    for(const symbol of symbols){
        if (!/^[0-9.]/.test(symbol)) return false
    }

    return true
}

/** Возвращает ссылку на оплату **/
function getPayment(amount, payment_id) {
    return `https://qiwi.com/payment/form/99?extra[%27account%27]=79649645528&amountInteger=${amount}&currency=643&amountFraction=00&comment=${payment_id}&blocked[0]=account&blocked[1]=comment&blocked[2]=sum`
    // return `https://pay.freekassa.ru?m=${config.freekassa.id}&currency=${config.freekassa.currency}&oa=${amount}&o=${payment_id}&s=${md5(`${config.freekassa.id}:${amount}:${config.freekassa.secret}:${config.freekassa.currency}:${payment_id}`)}`
}

module.exports = { Message, VKeyboard, plurals, getRank, getComm, isValidSum, getPayment }
