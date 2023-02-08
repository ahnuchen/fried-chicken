/**
 * Token工具类
 */

// 引入模块依赖
const jwt = require('jsonwebtoken')

//引入自定义的异常
const UnauthorizedError = require('../error/UnauthorizedError')

// 创建 token 类
class JwtToken {
    constructor(days) {
        this.SECRET = 'demo' //token密钥
        this.days = days //授权时效，天数
    }

    //生成token
    getToken(data) {
        let token = jwt.sign(data, this.SECRET, {
            expiresIn: this.days * 24 * 60 * 60 //超时时间，单位s
        })
        return token
    }

    //解析token
    parseToken(token) {
        return new Promise((resolve, reject) => {
            jwt.verify(token, this.SECRET, (err, data) => {
                if (err) {
                    reject(new UnauthorizedError('token解析失败'))
                } else {
                    resolve(data)
                }
            })
        })
    }
}

module.exports = new JwtToken(30)
