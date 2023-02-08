/**
 * 消息实例
 */
class Message {
    constructor(type, room, user, data, content) {
        //消息类型
        this.type = type
        //房间ID
        this.room = room
        //所属用户
        this.user = user || {}
        //数据
        this.data = data || {}
        //文本
        this.content = content || ''
    }
}

module.exports = Message
