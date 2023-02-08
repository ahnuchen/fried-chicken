//引入express模块
const express = require('express')
//创建路由器对象
let router = express.Router()
//引入JsonResult类
const JsonResult = require('../object/JsonResult')
//引入业务类
const DictService = require('../service/DictService')

//获取字典
router.post('/getDict', (req, res, next) => {
	DictService.getDict(req)
		.then(result => {
			return res.json(JsonResult.success(result))
		})
		.catch(error => {
			next(error)
		})
})

//修改字典
router.post('/modifyDict', (req, res, next) => {
	DictService.modifyDict(req)
		.then(result => {
			return res.json(JsonResult.success(result))
		})
		.catch(error => {
			next(error)
		})
})

module.exports = router
