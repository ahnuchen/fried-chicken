//引入异常
const ServiceError = require('../error/ServiceError')
//引入md5
const md5 = require('md5-node')
//引入token工具
const jwt = require('../jwt/JwtToken')
//引入工具类
const util = require('../util/util')
//引入sql
const pool = require('../pool.js')
//引入mysql-op
const SqlUtil = require('mysql-op')
//创建mysql-op实例
const sqlUtil = new SqlUtil(pool, 'admin')
//创建业务类
const service = {}

//登录
service.login = async req => {
	const admin_account = req.body.admin_account
	const admin_password = req.body.admin_password

	if (util.hasUndefinedParam([admin_account, admin_password])) {
		throw new ServiceError('参数异常')
	}
	const admins = await sqlUtil.query('admin_account', admin_account)
	if (admins.length == 0) {
		throw new ServiceError('账号错误')
	}
	const admin = admins[0]
	if (admin.admin_password != md5(admin_password)) {
		throw new ServiceError('密码错误，请重新输入')
	}
	//生成token
	const token = jwt.getToken({
		admin_id: admin.admin_id,
		admin_account: admin_account
	})
	return token
}

//根据ID查询管理员信息
service.getAdminById = async admin_id => {
	const admins = await sqlUtil.query('admin_id', admin_id)
	if (admins.length == 0) {
		return null
	}
	let admin = admins[0]
	if (admin) {
		delete admin.admin_password
	}
	return admin
}

module.exports = service
