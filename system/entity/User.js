/**
 * 用户
 */
class User {
    constructor(
        user_id,
        user_name,
        user_password,
        user_register,
        user_login,
        user_nickname,
        user_ban
    ) {
        //用户ID
        this.user_id = user_id
        //登录账号
        this.user_name = user_name
        //登录密码
        this.user_password = user_password
        //注册时间
        this.user_register = user_register
        //登录时间
        this.user_login = user_login
        //用户昵称
        this.user_nickname = user_nickname
        //用户是否禁止登录，0是1否
        this.user_ban = user_ban
    }
}

module.exports = User
