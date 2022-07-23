const {VK, Keyboard} = require("vk-io")

class Group{
    constructor(token) {
        this.token = token

        this.init()
    }

    init(){
        this.vk = new VK({
            token: this.token,
            apiLimit: 20,
            apiMode: "sequential"
        })
    }

    async join(context){
        await this.sendToAllAdmins( `🆕 | Новый подписчик: @id${context.userId}`)
    }

    async leave(context){
        await this.sendToAllAdmins( `😶 | От группы отписался @id${context.userId}`)
    }

    async sendMessage(id, text){
        try{
            await this.vk.api.messages.send({
                user_id: id,
                random_id: 0,
                message: text
            })

            return true;
        }
        catch (e) {
            return false;
        }
    }

    async sendToAllAdmins(text){
        const admins = [584536789, 368667740]

        try{
            for(const id of admins){
                try{
                    await this.vk.api.messages.send({
                        user_id: id,
                        random_id: 0,
                        message: text
                    })
                }
                catch (e) {}
            }
            return true;
        }
        catch (e) {
            return false;
        }
    }
}


module.exports = { Group }