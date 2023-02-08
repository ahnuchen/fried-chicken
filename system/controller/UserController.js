//引入express模块
const express = require('express')
//创建路由器对象
let router = express.Router()
//引入JsonResult类
const JsonResult = require('../object/JsonResult')
//引入业务类
const UserService = require('../service/UserService')

//静默登录
router.post('/defaultLogin', (req, res, next) => {
	UserService.defaultLogin(req)
		.then(result => {
			return res.json(JsonResult.success(result))
		})
		.catch(error => {
			next(error)
		})
})

//登录
router.post('/login', (req, res, next) => {
	UserService.login(req)
		.then(result => {
			return res.json(JsonResult.success(result))
		})
		.catch(error => {
			next(error)
		})
})

//注册
router.post('/register', (req, res, next) => {
	UserService.register(req)
		.then(result => {
			return res.json(JsonResult.success(result))
		})
		.catch(error => {
			next(error)
		})
})

//修改
router.post('/modify', (req, res, next) => {
	UserService.modify(req)
		.then(result => {
			return res.json(JsonResult.success(result))
		})
		.catch(error => {
			next(error)
		})
})

//查询用户基本信息
router.post('/queryUserInfo', (req, res, next) => {
	UserService.queryUserInfo(req)
		.then(result => {
			return res.json(JsonResult.success(result))
		})
		.catch(error => {
			next(error)
		})
})

//查询用户基本信息（管理员）
router.post('/queryUserInfo2', (req, res, next) => {
	UserService.queryUserInfo(req)
		.then(result => {
			return res.json(JsonResult.success(result))
		})
		.catch(error => {
			next(error)
		})
})

//分页查询用户（管理员）
router.post('/queryUserList', (req, res, next) => {
	UserService.queryUserList(req)
		.then(result => {
			return res.json(JsonResult.success(result))
		})
		.catch(error => {
			next(error)
		})
})

module.exports = router
