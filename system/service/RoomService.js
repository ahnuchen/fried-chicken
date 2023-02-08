//引入异常
const ServiceError = require('../error/ServiceError')
//引入实体
const Room = require('../entity/Room')
const PageObject = require('../object/PageObject')
//引入sql
const pool = require('../pool.js')
//引入mysql-op
const SqlUtil = require('mysql-op')
const util = require('../util/util')
//创建mysql-op实例
const sqlUtil = new SqlUtil(pool, 'room')
//引入用户业务
const UserService = require('./UserService')
//创建业务类
const service = {}
//引入moment
const moment = require('moment')
//引入roomUtil
const roomUtil = require('../socket/roomUtil')

//删除创建超过24小时的未完成的房间
const deleteIntervalFn = async () => {
	try {
		//获取24小时前的时间
		let roomBegin = moment().subtract(1, 'day').valueOf()
		let params = {
			room_status: 0,
			room_begin: [null, roomBegin]
		}
		const counts = await sqlUtil.queryCounts(params)
		if (counts > 0) {
			const rooms = await sqlUtil.querys(
				{
					room_status: 0,
					room_begin: [null, roomBegin]
				},
				'and',
				'room_begin',
				'asc',
				0,
				counts,
				[]
			)
			for (let room of rooms) {
				//如果缓存中存在该房间则移除
				if (roomUtil.getRoom(room.room_id)) {
					roomUtil.removeRoom(room.room_id)
				}
				await sqlUtil.delete('room_id', room.room_id)
			}
		}
	} catch (error) {
		console.log('删除创建超过24小时的未完成的房间', error)
	}
}
deleteIntervalFn()
//设置定时任务每隔3天执行一次
setInterval(async () => {
	deleteIntervalFn()
}, 3 * 24 * 60 * 60 * 1000)

//统计用户分数
service.queryTotalScoresByUser = async req => {
	const user_id = req.body.user_id
	if (!user_id) {
		throw new ServiceError('参数异常')
	}
	let params = {
		room_players: {
			value: '/' + user_id + '/',
			fuzzy: true
		},
		room_status: 2
	}
	const counts = await sqlUtil.queryCounts(params, 'and')
	if (counts == 0) {
		throw new ServiceError('该用户暂无对局数据')
	}
	const rooms = await sqlUtil.querys(params, 'and', 'room_end', 'desc', 0, counts, ['room_records'])
	let total = 0
	rooms.forEach(room => {
		room = roomUtil.initRoomObject(room)
		const records = room.getRoomRecords()
		if (records.scores && records.scores[user_id]) {
			total += records.scores[user_id]
		}
	})
	return total
}

//分页查询对局记录
service.queryHistoryPage = async req => {
	const pageSize = Number(req.body.pageSize) || 10
	const pageCurrent = Number(req.body.pageCurrent) || 1
	const startIndex = (pageCurrent - 1) * pageSize
	let params = {
		'room.room_status': 2
	}
	let tables = [
		{
			table: 'user',
			columns: ['user.user_id', 'room.room_creator']
		}
	]
	const counts = await sqlUtil.queryCounts(params, 'and', tables)
	if (counts == 0) {
		throw new ServiceError('暂无对局')
	}
	const rooms = await sqlUtil.querys(params, 'and', 'room.room_end', 'desc', startIndex, pageSize, ['room.room_id', 'room.room_creator', 'room.room_mode', 'room.room_begin', 'room.room_end', 'room.room_status', 'room.room_players', 'room.room_type', 'user.user_nickname'], tables)
	return {
		rooms: rooms,
		pageObject: new PageObject(pageCurrent, pageSize, counts)
	}
}

//查询对局
service.queryRoom = async req => {
	const room_id = req.body.room_id
	if (!room_id) {
		throw new ServiceError('未获取到房间号')
	}
	const rooms = await sqlUtil.query('room_id', room_id)
	if (rooms.length == 0) {
		throw new ServiceError('查无此房间信息')
	}
	return rooms[0]
}

//查询用户近20局记录
service.queryHistory = async req => {
	const user = await UserService.getUserByToken(req)
	let params = {
		'room.room_players': {
			value: '/' + user.user_id + '/',
			fuzzy: true
		},
		'room.room_status': 2
	}
	let tables = [
		{
			table: 'user',
			columns: ['user.user_id', 'room.room_creator']
		}
	]
	const counts = await sqlUtil.queryCounts(params, 'and', tables)
	if (counts == 0) {
		throw new ServiceError('暂无对局')
	}
	let size = counts > 20 ? 20 : counts
	const rooms = await sqlUtil.querys(params, 'and', 'room.room_end', 'desc', 0, size, ['room.room_id', 'room.room_creator', 'room.room_mode', 'room.room_begin', 'room.room_end', 'room.room_status', 'room.room_players', 'room.room_type', 'user.user_nickname'], tables)
	return rooms
}

//创建房间
service.create = async req => {
	let room_mode = req.body.room_mode
	let room_type = req.body.room_type

	if (util.hasUndefinedParam([room_mode, room_type])) {
		throw new ServiceError('参数异常')
	}
	room_mode = Number(room_mode)
	room_type = Number(room_type)
	if (isNaN(room_mode) || isNaN(room_type)) {
		throw new ServiceError('参数异常')
	}
	const user = await UserService.getUserByToken(req)
	let room = new Room(null, user.user_id, '{}', room_mode, Date.now(), null, 0, null, room_type)
	const result = await sqlUtil.insert(room)
	if (result.affectedRows == 0) {
		throw new ServiceError('创建失败')
	}
	room.room_id = result.insertId
	return room
}

//校验房间
service.check = async req => {
	const room_id = req.body.room_id
	if (!room_id) {
		throw new ServiceError('参数异常')
	}
	const rooms = await sqlUtil.query('room_id', room_id)
	if (rooms.length == 0) {
		throw new ServiceError('房间不存在')
	}
	const room = rooms[0]
	if (room.room_status == 2) {
		throw new ServiceError('该房间对局已经结束')
	}
	return room
}

//解散房间
service.dissolution = async room_id => {
	const rooms = await sqlUtil.query('room_id', room_id)
	if (rooms.length == 0) {
		throw new ServiceError('房间不存在')
	}
	const room = rooms[0]
	if (room.room_status == 2) {
		throw new ServiceError('已结束的房间无法解散')
	}
	const result = await sqlUtil.delete('room_id', room_id)
	if (result.affectedRows == 0) {
		throw new ServiceError('解散失败')
	}
}

//查询对局中的房间信息
service.query = async room_id => {
	const rooms = await sqlUtil.query('room_id', room_id)
	if (rooms.length == 0) {
		throw new ServiceError('房间不存在')
	}
	const room = rooms[0]
	if (room.room_status == 2) {
		throw new ServiceError('房间对局已结束')
	}
	return room
}

//更新房间状态
service.update = async roomInfo => {
	const rooms = await sqlUtil.query('room_id', roomInfo.room_id)
	if (rooms.length == 0) {
		throw new ServiceError('该房间已被解散')
	}
	const result = sqlUtil.update(roomInfo, 'room_id')
	if (result.affectedRows == 0) {
		throw new ServiceError('更新失败')
	}
}

module.exports = service
