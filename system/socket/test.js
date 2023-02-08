const roomUtil = require('./roomUtil')
const util = require('../util/util')
const SqlUtil = require('mysql-op')
const pool = require('../pool.js')
const sqlUtil = new SqlUtil(pool, 'room')
const lockJS = require('./lock')
const RoomService = require('../service/RoomService')
const dictSqlUtil = new SqlUtil(pool, 'dict')

//获取特殊人员
const a = async () => {
    let USER_ID = null
    let dicts = await dictSqlUtil.query('dict_key', 'SPECIAL_USER')
    if (dicts.length) {
        USER_ID = dicts[0].dict_value
    }
    console.log(USER_ID)
}

a()
