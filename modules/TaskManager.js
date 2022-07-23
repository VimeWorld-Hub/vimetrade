const fs = require('fs')

class Manager{
    constructor() {
        this.tasks = new Map()
        this.run()
    }

    run(){
        fs.readdir("./tasks", (err, files) => {
            if(err) return console.error(err);

            files.forEach((file) => {
                if(!file.endsWith(".js")) return;

                let task = require(`../tasks/${file}`);
                if(!task.info.enabled) return;

                this.tasks.set(task.info.name, task)
                task.run()
                setInterval(function() {
                    task.run()
                }, task.info.update)
            })
        })

        return this.tasks
    }
}

module.exports = { Manager }