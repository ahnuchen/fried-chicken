//引入express模块
const express = require('express')
const path = require('path')
//引入中间件
const bodyParser = require('body-parser')
//引入JsonResult类
const JsonResult = require('./object/JsonResult')
//引入token工具
const jwt = require('./jwt/JwtToken')
//引入接口请求验证方法
const filter = require('./filter/filter')
const adminFilter = require('./filter/adminFilter')
//引入token异常
const UnauthorizedError = require('./error/UnauthorizedError')
//引入socket
const ws = require('nodejs-websocket')
const socketBJ = require('./socket/index_bj')
const socketZJ = require('./socket/index_zj')
const UserService = require('./service/UserService')
const AdminService = require('./service/AdminService')

//创建web服务器
let app = express()
app.all('*', (req, res, next) => {
    //设置允许跨域的域名，*代表允许任意域名跨域
    res.setHeader('Access-Control-Allow-Origin', '*')
    //允许的header类型
    res.setHeader('Access-Control-Allow-Headers', '*')
    //跨域允许的请求方式
    res.setHeader('Access-Control-Allow-Methods', 'DELETE,PUT,POST,GET,OPTIONS')
    if (req.method.toLowerCase() == 'options') res.sendStatus(200) //让options尝试请求快速结束
    else next()
})
//监听端口
app.listen(3040, '0.0.0.0').on('listening', () => {
    console.log('app listen on port 3040')
})
//使用body-parser中间件
app.use(
    bodyParser.json({
        limit: '500mb'
    })
)
app.use(
    bodyParser.urlencoded({
        limit: '50mb',
        extended: true
    })
)
app.use('/poker/admin', express.static(path.join(__dirname, '../admin/dist')), express.static(path.join(__dirname, '../admin/dist/index.html')))
app.use('/poker/applet', express.static(path.join(__dirname, '../applet/dist')), express.static(path.join(__dirname, '../applet/dist/index.html')))

//请求访问拦截
app.use((req, res, next) => {
    let url = req.originalUrl //获取浏览器中当前访问的nodejs路由地址
    let token = req.headers['authorization']
    //该地址需要验证管理员权限
    if (adminFilter(url)) {
        if (token) {
            //解析token
            jwt.parseToken(token)
                .then(async jwtResult => {
                    const admin = await AdminService.getAdminById(jwtResult.admin_id)
                    if (admin) {
                        next()
                    } else {
                        next(new UnauthorizedError('管理员不存在'))
                    }
                })
                .catch(error => {
                    next(error)
                })
        } else {
            //token不存在，直接不给通过
            next(new UnauthorizedError('请求头未携带token信息，校验不通过'))
        }
    }
    //该地址需要验证用户权限
    else if (filter(url)) {
        if (token) {
            //解析token
            jwt.parseToken(token)
                .then(async jwtResult => {
                    const user = await UserService.getUserById(jwtResult.user_id)
                    if (user) {
                        if (user.user_ban == 0) {
                            next(new UnauthorizedError('抱歉，该账号已被禁止使用'))
                        } else {
                            next()
                        }
                    } else {
                        next(new UnauthorizedError('此用户已不存在'))
                    }
                })
                .catch(error => {
                    next(error)
                })
        } else {
            //token不存在，直接不给通过
            next(new UnauthorizedError('请求头未携带token信息，校验不通过'))
        }
    } else {
        next()
    }
})
//引入controller目录下的js接口文件
const UserController = require('./controller/UserController')
const RoomController = require('./controller/RoomController')
const AdminController = require('./controller/AdminController')
const DictController = require('./controller/DictController')
//挂载路由器
app.use('/api/user', UserController)
app.use('/api/room', RoomController)
app.use('/api/admin', AdminController)
app.use('/api/dict', DictController)
//异常捕获
app.use((error, req, res, next) => {
    if (error) {
        console.log(error)
        if (error.name == 'ServiceError') {
            res.json(new JsonResult(JsonResult.STATUS_SERVICE_ERROR, error.message))
        } else if (error.name == 'UnauthorizedError') {
            res.json(new JsonResult(JsonResult.STATUS_TOKEN_ERROR, error.message))
        } else {
            res.json(new JsonResult(JsonResult.STATUS_SYSTEM_ERROR, error.message))
        }
    }
})

//创建比鸡连接
const createServerBJ = () => {
    let server = ws
        .createServer(connection => {
            //接收消息
            connection.on('text', result => {
                socketBJ.receiveMessage(result, connection, server)
            })
            //连接出错
            connection.on('error', code => {
                socketBJ.error(code, connection, server)
            })
            //连接关闭
            connection.on('close', code => {
                socketBJ.close(code, connection, server)
            })
        })
        .listen(3041)

    return server
}
//创建炸鸡连接
const createServerZJ = () => {
    let server = ws
        .createServer(connection => {
            //接收消息
            connection.on('text', result => {
                socketZJ.receiveMessage(result, connection, server)
            })
            //连接出错
            connection.on('error', code => {
                socketZJ.error(code, connection, server)
            })
            //连接关闭
            connection.on('close', code => {
                socketZJ.close(code, connection, server)
            })
        })
        .listen(3042)
    return server
}
createServerBJ()
createServerZJ()
