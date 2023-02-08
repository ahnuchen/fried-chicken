//引入异常
const ServiceError = require('../error/ServiceError')
const UnauthorizedError = require('../error/UnauthorizedError')
//引入md5
const md5 = require('md5-node')
//引入token工具
const jwt = require('../jwt/JwtToken')
//引入工具类
const util = require('../util/util')
//引入实体
const User = require('../entity/User')
const PageObject = require('../object/PageObject')
//引入sql
const pool = require('../pool.js')
//引入mysql-op
const SqlUtil = require('mysql-op')
//创建mysql-op实例
const sqlUtil = new SqlUtil(pool, 'user')
const dictSqlUtil = new SqlUtil(pool, 'dict')
//创建业务类
const service = {}

//根据ID查询用户基本信息
service.queryUserInfo = async req => {
	const user_id = req.body.user_id
	if (util.hasUndefinedParam([user_id])) {
		throw new ServiceError('未获取到用户ID')
	}
	const users = await sqlUtil.query('user_id', user_id, ['user_id', 'user_name', 'user_register', 'user_login', 'user_nickname'])
	if (users.length == 0) {
		throw new ServiceError('用户不存在')
	}
	return users[0]
}

//静默登录
service.defaultLogin = async req => {
	let token = req.headers['authorization']
	let user = await jwt.parseToken(token)
	const users = await sqlUtil.query('user_id', user.user_id)
	if (users.length == 0) {
		throw new UnauthorizedError('此用户已不存在')
	}
	user = users[0]
	//更新登录时间
	user.user_login = Date.now()
	await sqlUtil.update(user, 'user_id')
	//生成新的token
	const newToken = jwt.getToken({
		user_id: user.user_id,
		user_name: user.user_name
	})
	//删除密码
	delete user.user_password
	return {
		user: user,
		token: newToken
	}
}

//登录
service.login = async req => {
	const user_name = req.body.user_name
	const user_password = req.body.user_password
	if (util.hasUndefinedParam([user_name, user_password])) {
		throw new ServiceError('参数异常')
	}
	const users = await sqlUtil.query('user_name', user_name)
	if (users.length == 0) {
		throw new ServiceError('该账号尚未注册')
	}
	const user = users[0]
	if (user.user_password != md5(user_password)) {
		throw new ServiceError('密码错误，请重新输入')
	}
	//是否已被禁止登录
	if (user.user_ban == 0) {
		throw new ServiceError('抱歉，该账号已被禁止使用')
	}
	//更新登录时间
	user.user_login = Date.now()
	await sqlUtil.update(user, 'user_id')
	//生成token
	const token = jwt.getToken({
		user_id: user.user_id,
		user_name: user_name
	})
	//删除密码
	delete user.user_password
	return {
		user: user,
		token: token
	}
}

//注册
service.register = async req => {
	const user_name = req.body.user_name
	const user_password = req.body.user_password
	const user_nickname = req.body.user_nickname
	let PROMISE_REGISTER = 0
	//获取是否允许注册的字典值
	const dict = await dictSqlUtil.query('dict_key', 'PROMISE_REGISTER')
	if (dict.length > 0) {
		PROMISE_REGISTER = Number(dict[0].dict_value) || 0
	}
	//如果是1则表示不允许新用户注册
	if (PROMISE_REGISTER == 1) {
		throw new ServiceError('抱歉，目前服务器负载过高，注册功能暂时关闭')
	}
	if (util.hasUndefinedParam([user_name, user_password, user_nickname])) {
		throw new ServiceError('参数异常')
	}
	if (user_nickname.length > 8) {
		throw new ServiceError('昵称参数异常')
	}
	if (!util.isUserName(user_name)) {
		throw new ServiceError('账号参数异常')
	}
	if (user_password.length < 8) {
		throw new ServiceError('密码参数异常')
	}
	const users = await sqlUtil.query('user_name', user_name)
	if (users.length) {
		throw new ServiceError('该账号已被注册')
	}
	const users2 = await sqlUtil.query('user_nickname', user_nickname)
	if (users2.length) {
		throw new ServiceError('该昵称已被别人使用了')
	}
	const user = new User(null, user_name, md5(user_password), Date.now(), Date.now(), user_nickname, 1)
	const result = await sqlUtil.insert(user)
	if (result.affectedRows == 0) {
		throw new ServiceError('注册失败')
	}
}

//修改
service.modify = async req => {
	const user_name = req.body.user_name
	const user_password = req.body.user_password
	const user_nickname = req.body.user_nickname
	const user_id = req.body.user_id

	if (util.hasUndefinedParam([user_id])) {
		throw new ServiceError('参数异常')
	}

	const users = await sqlUtil.query('user_id', user_id)
	if (users.length == 0) {
		throw new ServiceError('未查询到用户信息')
	}

	let user = users[0]

	if (user_nickname) {
		if (user_nickname.length > 8) {
			throw new ServiceError('昵称参数异常')
		}
		const users2 = await sqlUtil.query('user_nickname', user_nickname)
		if (users2.length && users2[0].user_id != user.user_id) {
			throw new ServiceError('该昵称已被别人使用了')
		}
		user.user_nickname = user_nickname
	}

	if (user_name) {
		if (!util.isUserName(user_name)) {
			throw new ServiceError('账号参数异常')
		}
		const users3 = await sqlUtil.query('user_name', user_name)
		if (users3.length) {
			throw new ServiceError('该账号已被注册')
		}
		user.user_name = user_name
	}

	if (user_password) {
		if (user_password.length < 8) {
			throw new ServiceError('密码参数异常')
		}
		user.user_password = md5(user_password)
	}

	const result = await sqlUtil.update(user, 'user_id')
	if (result.affectedRows == 0) {
		throw new ServiceError('修改失败')
	}
	delete user.user_password
	return user
}

//根据token获取用户信息
service.getUserByToken = async req => {
	let token = req.headers['authorization']
	if (!token) {
		throw new ServiceError('未获取到token信息')
	}
	const user = await jwt.parseToken(token)
	return user
}

//根据ID查询用户信息
service.getUserById = async user_id => {
	const users = await sqlUtil.query('user_id', user_id)
	if (users.length == 0) {
		return null
	}
	let user = users[0]
	if (user) {
		delete user.user_password
	}
	return user
}

//分页查询用户
service.queryUserList = async req => {
	const pageSize = Number(req.body.pageSize) || 10
	const pageCurrent = Number(req.body.pageCurrent) || 1
	const startIndex = (pageCurrent - 1) * pageSize
	const counts = await sqlUtil.queryCounts({}, 'and')
	if (counts == 0) {
		throw new ServiceError('暂无用户')
	}
	const users = await sqlUtil.querys({}, 'and', 'user_register', 'desc', startIndex, pageSize)
	return {
		users: users,
		pageObject: new PageObject(pageCurrent, pageSize, counts)
	}
}

module.exports = service
