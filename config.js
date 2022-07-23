const os = require('os')

module.exports = {
    mysql: {
        debug: {
            host: "127.0.0.1",
            user: "",
            database: "",
            password: ""
        },
        release: {
            host: "127.0.0.1",
            user: "",
            database: "",
            password: ""
        }
    },
    bot: {
        "version": "1.0",
        "debug": os.hostname() !== "chrk.top", //хостнейм для определения статуса дебага
        "security_bot": "", //токен бота для уведомлений админам
        "token": {
            "release": "", //токен релизного бота
            "debug": "" //токен дебаг бота
        },
        "id": {
            "release": -1, //айди релизного бота
            "debug": -1 //айди дебаг бота
        }
    },
    vimpy: "", //токен юзера для некоторых операций
    vimeworld: {
        dev_token: "", //токен разработчика
        vimeapi_token: "", //токен апишки лк
        vimeapi_domen: "" //домен апишки лк
    },
    freekassa: {
        id: -1,
        currency: 'RUB',
        secret: '',
        secret_2: ''
    }
}