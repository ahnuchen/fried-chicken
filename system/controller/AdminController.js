//引入express模块
const express = require('express')
//创建路由器对象
let router = express.Router()
//引入JsonResult类
const JsonResult = require('../object/JsonResult')
//引入业务类
const AdminService = require('../service/AdminService')

//登录
router.post('/login', (req, res, next) => {
	AdminService.login(req)
		.then(result => {
			return res.json(JsonResult.success(result))
		})
		.catch(error => {
			next(error)
		})
})

module.exports = router
