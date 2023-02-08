//实现锁机制

//函数队列集合
const LOCKLIST = {}

//执行队列函数
const handler = async roomId => {
    //获取队列的第一个函数
    const fn = LOCKLIST[roomId][0]
    //执行函数
    if (fn) {
        await fn().catch(error => {
            LOCKLIST[roomId].shift()
            throw error
        })
    }
    //删除第一个函数
    LOCKLIST[roomId].shift()
    //如果还有函数
    if (LOCKLIST[roomId].length) {
        await handler(roomId).catch(error => {
            throw error
        })
    }
}

module.exports = async (roomId, fn) => {
    if (!LOCKLIST[roomId]) {
        LOCKLIST[roomId] = []
    }
    //推入函数
    LOCKLIST[roomId].push(fn)
    console.log('LOCKLIST[roomId].length', LOCKLIST[roomId].length)
    //如果该函数是第一个，则执行
    if (LOCKLIST[roomId].length == 1) {
        await handler(roomId).catch(error => {
            throw error
        })
    }
}
