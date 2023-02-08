const mysql = require('mysql')
//创建连接池对象
let pool = mysql.createPool({
    host: 'localhost', //数据库IP地址
    port: '3306', //数据库端口
    user: 'root', //数据库账号
    password: 'root', //数据库密码
    database: 'poker-system', //数据库名称
    connectionLimit: 15 //连接池限制
})

//导出连接池
module.exports = pool
