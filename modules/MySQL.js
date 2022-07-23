const mysql = require("mysql2")

class MySQL{
    constructor(host, user, password, database) {
        this.host = host
        this.user = user
        this.password = password
        this.database = database

        this.connection = this.connection = mysql.createConnection({
            host: this.host,
            user: this.user,
            database: this.database,
            password: this.password,
        })
        this.connection.query("SET SESSION wait_timeout = 604800")
    }

    async execute(query, params = []) {
        return await new Promise((resolve, reject) => {
            this.connection.query(
                query,
                params,
                function(err, results, fields) {
                    if(err) return reject(err.stack);
                    resolve(results);
                }
            )
        })
    }
}

module.exports = {MySQL}