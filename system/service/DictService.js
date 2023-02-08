//引入异常
const ServiceError = require('../error/ServiceError')
//引入工具类
const util = require('../util/util')
//引入sql
const pool = require('../pool.js')
//引入mysql-op
const SqlUtil = require('mysql-op')
//创建mysql-op实例
const sqlUtil = new SqlUtil(pool, 'dict')
//创建业务类
const service = {}

//修改字典值
service.modifyDict = async req => {
	const dict_key = req.body.dict_key
	const dict_value = req.body.dict_value
	if (util.hasUndefinedParam([dict_key, dict_value])) {
		throw new ServiceError('参数异常')
	}
	const dicts = await sqlUtil.query('dict_key', dict_key)
	if (dicts.length == 0) {
		throw new ServiceError('该字典已不存在')
	}
	const dict = dicts[0]
	dict.dict_value = dict_value
	const result = await sqlUtil.update(dict, 'dict_id')
	if (result.affectedRows == 0) {
		throw new ServiceError('修改失败')
	}
}

//获取某个字典值
service.getDict = async req => {
	const dict_key = req.body.dict_key
	if (util.hasUndefinedParam([dict_key])) {
		throw new ServiceError('参数异常')
	}
	const dicts = await sqlUtil.query('dict_key', dict_key)
	if (dicts.length == 0) {
		throw new ServiceError('查无数据')
	}
	return dicts[0]
}

module.exports = service
