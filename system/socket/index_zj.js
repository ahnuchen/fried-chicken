const Message = require('../entity/Message')
const RoomService = require('../service/RoomService')
const roomUtil = require('./roomUtil')
const ServiceError = require('../error/ServiceError')
const lockQueue = require('./lock')
//底分，即每局都要扣除的分数
const BOTTOM_SCORE = 1
//跟牌分数
const FOLLOW_SCORE = 1
//吃喜分数
const HAPPY_SCORES = [5, 8]
//最大人数
const MAX_PERSON_NUMBERS = 4

/**
 * records包含的基本字段
 * scores   记录每个用户的得分
 * operations   记录每个用户的操作，值为0/1/2，分别表示未看牌/已看牌/已丢牌，每一局会重置
 * currentGame  当前对局是第几局
 * pokers   记录每个用户该局的牌，每一局会重置
 * userInfos    记录参与对局的用户信息，不会随着用户退出而变化
 * followScore  记录跟牌分数，每一局会重置
 * spokesman    记录当前发言人ID，每一次发言人变换都会更新
 * innerScores  每一局的盘内总分，每一局会重置
 * watchNumbers 记录每一次讲话私下看牌的次数，每一局会重置
 * opens    每个用户的明牌上分次数，每一局会重置
 * stuffies    每个用户的闷牌上分次数，每一局会重置
 * throwCounts 丢球次数 每一局会重置
 */

//推送异常消息
const sendErrorMsg = (connection, message, needRefresh) => {
    const msg = new Message(
        -1,
        connection.room,
        connection.user,
        {
            needRefresh: needRefresh
        },
        message
    )
    connection.send(JSON.stringify(msg))
}

//计算分数
const doCountScore = (res, connection, server) => {
    //4s延迟
    setTimeout(() => {
        let roomInfo = roomUtil.getRoom(res.room)
        //获取该房间的所有连接
        const roomConnections = server.connections.filter(item => {
            return item.room == res.room
        })
        //获取用户数组
        const users = roomConnections.map(item => {
            return item.user
        })
        //获取records
        let records = roomInfo.getRoomRecords()
        //获取没有丢牌的用户
        let unDiscardUsers = roomUtil.getUnDiscardUsers(Object.keys(records.pokers), records.operations)
        console.log('unDiscardUsers', unDiscardUsers)
        //记录赢家用户ID
        let winUser = null
        //如果只有一个则直接给这个用户加上盘内分数
        if (unDiscardUsers.length == 1) {
            winUser = unDiscardUsers[0]
        }
        //如果不是一个，那么就是2个，获取赢家
        else {
            //获取赢的用户ID
            winUser = roomUtil.compareTwoPokers(records.pokers[unDiscardUsers[0]], records.pokers[unDiscardUsers[1]]) ? unDiscardUsers[0] : unDiscardUsers[1]
        }
        //赢者加分
        records.scores[winUser] += records.innerScores

        //更新去重userInfos，防止重复
        records.userInfos = roomUtil.updateUserInfos(records.userInfos)

        //如果赢者是豹子或者同花顺
        const isBao = roomUtil.isBao(records.pokers[winUser])
        const isTHS = roomUtil.isSameFlower(records.pokers[winUser]) && roomUtil.isShun(records.pokers[winUser])
        //赢者闷牌次数大于0才能吃喜
        console.log('赢者闷牌次数', winUser, records.stuffies[winUser])
        //豹子、同花顺并且闷牌次数大于0才会吃喜
        if ((isBao || isTHS) && records.stuffies[winUser] > 0) {
            //获取明牌和闷牌次数总和大于0的其他用户
            const otherUsers = Object.keys(records.pokers).filter(item => {
                console.log('玩家ID', item, '其他玩家闷牌次数', records.stuffies[item], '上牌次数', records.opens[item])
                return item != winUser && records.opens[item] + records.stuffies[item] > 0
            })
            console.log('参与吃喜的用户', otherUsers)
            //豹子加分多，同花顺加分稍微少点
            const happyScore = isBao ? HAPPY_SCORES[1] : HAPPY_SCORES[0]
            console.log('吃喜加分', happyScore)
            records.scores[winUser] += happyScore * otherUsers.length
            //其余用户减分
            otherUsers.forEach(item => {
                records.scores[item] -= happyScore
            })
        }
        //将这局记录到历史中去
        records.histories.push({
            scores: JSON.parse(JSON.stringify(records.scores)),
            operations: JSON.parse(JSON.stringify(records.operations)),
            currentGame: records.currentGame,
            pokers: JSON.parse(JSON.stringify(records.pokers)),
            userInfos: JSON.parse(JSON.stringify(records.userInfos)),
            followScore: records.followScore,
            innerScores: records.innerScores,
            watchNumbers: JSON.parse(JSON.stringify(records.watchNumbers)),
            opens: JSON.parse(JSON.stringify(records.opens)),
            stuffies: JSON.parse(JSON.stringify(records.stuffies))
        })
        //判断是否结束
        if (records.currentGame == roomInfo.room_mode) {
            //更新records
            roomInfo.setRoomRecords(records)
            roomUtil.updateRoom(res.room, roomInfo)
            //结束
            overGame(res, connection, server)
        } else {
            //记录当前局数
            records.currentGame = records.currentGame + 1
            console.log('即将进入第' + records.currentGame + '局')
            //初始化跟牌分数
            records.followScore = FOLLOW_SCORE
            //设置发言人为上局的赢家
            records.spokesman = winUser
            //初始化该局盘内分数
            records.innerScores = records.userInfos.length * BOTTOM_SCORE
            //初始化每个用户的积分和牌组操作记录和上牌记录、私人看牌次数
            let operations = {}
            let stuffies = {}
            let opens = {}
            let watchNumbers = {}
            let scores = records.scores
            let throwCounts = {}
            records.userInfos.forEach(item => {
                scores[item.user_id] -= BOTTOM_SCORE
                operations[item.user_id] = 0
                stuffies[item.user_id] = 0
                opens[item.user_id] = 0
                watchNumbers[item.user_id] = 0
                throwCounts[item.user_id] = 0
            })
            records.scores = scores
            records.operations = operations
            records.opens = opens
            records.stuffies = stuffies
            records.watchNumbers = watchNumbers
            records.throwCounts = throwCounts
            // 重新设置records
            roomInfo.setRoomRecords(records)
            //记录
            roomUtil.updateRoom(res.room, roomInfo)
            //发牌
            roomUtil.licensingZJ(res.room, Object.keys(scores))
            //重新获取
            roomInfo = roomUtil.getRoom(res.room)
            //推送
            roomConnections.forEach(conn => {
                const msg = new Message(
                    7,
                    conn.room,
                    conn.user,
                    {
                        users: users,
                        pokers: roomInfo.getRoomRecords().pokers,
                        currentGame: roomInfo.getRoomRecords().currentGame,
                        scores: roomInfo.getRoomRecords().scores,
                        userInfos: roomInfo.getRoomRecords().userInfos,
                        operations: roomInfo.getRoomRecords().operations,
                        followScore: roomInfo.getRoomRecords().followScore,
                        spokesman: roomInfo.getRoomRecords().spokesman,
                        innerScores: roomInfo.getRoomRecords().innerScores,
                        stuffies: roomInfo.getRoomRecords().stuffies,
                        opens: roomInfo.getRoomRecords().opens,
                        watchNumbers: roomInfo.getRoomRecords().watchNumbers,
                        throwCounts: roomInfo.getRoomRecords().throwCounts
                    },
                    `第${roomInfo.getRoomRecords().currentGame}局开始`
                )
                if (roomUtil.isInUserInfos(conn.user, roomInfo.getRoomRecords().userInfos)) {
                    conn.send(JSON.stringify(msg))
                }
            })
        }
    }, 4000)
}
//游戏结束
const overGame = async (res, connection, server) => {
    let roomInfo = roomUtil.getRoom(res.room)
    //记录结束时间
    roomInfo.room_end = Date.now()
    //更新房间状态为已完成
    roomInfo.room_status = 2
    //更新房间玩家数据
    let pokers = roomInfo.getRoomRecords().pokers
    roomInfo.room_players = '/' + Object.keys(pokers).join('/') + '/'
    //更新房间到数据库
    await RoomService.update(roomInfo)
    //获取该房间的所有连接
    const roomConnections = server.connections.filter(item => {
        return item.room == res.room
    })
    //获取用户数组
    const users = roomConnections.map(item => {
        return item.user
    })
    //推送
    roomConnections.forEach(conn => {
        const msg = new Message(
            9,
            conn.room,
            conn.user,
            {
                users: users,
                scores: roomInfo.getRoomRecords().scores
            },
            '本房间游戏结束'
        )
        conn.send(JSON.stringify(msg))
    })
    //推送完成后删除缓存的房间
    roomUtil.removeRoom(res.room)
}

module.exports = {
    //接收消息
    async receiveMessage(result, connection, server) {
        try {
            let res = JSON.parse(result)
            if (typeof res != 'object' || !res) {
                throw new ServiceError('参数异常')
            }
            //心跳检测消息
            if (res.type == 0) {
                const msg = new Message(0, res.room, res.user, {}, '心跳检测回执')
                connection.send(JSON.stringify(msg))
            }
            //有人加入房间
            else if (res.type == 1) {
                connection.room = res.room
                connection.user = res.user
                //获取该房间的所有连接
                const roomConnections = server.connections.filter(item => {
                    return item.room == res.room
                })
                //获取该房间的已连接的用户数组
                const users = roomConnections.map(item => {
                    return item.user
                })
                //判断是否已经在房间了
                const isExist = roomConnections.some(conn => {
                    return conn.user.user_id === connection.user.user_id && conn != connection
                })
                if (isExist) {
                    throw new ServiceError('你已经在房间里了，无法重复加入')
                }

                if (roomConnections.length > 4) {
                    throw new ServiceError('该房间已满员')
                }

                const fn = async () => {
                    //获取房间信息
                    let roomInfo = roomUtil.getRoom(res.room)
                    //如果该房间在对局中，则需要初始化此用户的一些信息
                    if (roomInfo && roomInfo.room_status == 1) {
                        //获取records
                        let records = roomInfo.getRoomRecords()
                        //获取分数
                        let scores = records.scores
                        //获取操作记录
                        let operations = records.operations
                        //获取用户信息
                        let userInfos = records.userInfos
                        //获取闷牌次数
                        let stuffies = records.stuffies
                        //获取明牌次数
                        let opens = records.opens
                        //获取私人看牌次数
                        let watchNumbers = records.watchNumbers
                        //获取丢球次数
                        let throwCounts = records.throwCounts
                        console.log('用户加入房间', res.user.user_id, records.pokers ? records.pokers[res.user.user_id] : null)
                        //如果不是对局用户之一并且房间满员
                        if (!roomUtil.isInUserInfos(res.user, userInfos) && userInfos.length == MAX_PERSON_NUMBERS) {
                            throw new ServiceError('对局已经开始并且该房间已满员')
                        }
                        //分数不存在重置分数
                        if (!scores[res.user.user_id]) {
                            scores[res.user.user_id] = 0
                        }
                        //没有牌操作记录则重置操作记录
                        if (!operations[res.user.user_id]) {
                            operations[res.user.user_id] = 0
                        }
                        //没有明牌次数则重置
                        if (!opens[res.user.user_id]) {
                            opens[res.user.user_id] = 0
                        }
                        //没有闷牌次数则重置
                        if (!stuffies[res.user.user_id]) {
                            stuffies[res.user.user_id] = 0
                        }
                        //没有私人看牌次数则重置
                        if (!watchNumbers[res.user.user_id]) {
                            watchNumbers[res.user.user_id] = 0
                        }
                        //没有丢球次数则重置
                        if (!throwCounts[res.user.user_id]) {
                            throwCounts[res.user.user_id] = 0
                        }
                        //更新userInfos
                        userInfos = roomUtil.updateUserInfos([...userInfos, res.user])
                        //更新到records
                        records.scores = scores
                        records.userInfos = userInfos
                        records.operations = operations
                        records.stuffies = stuffies
                        records.opens = opens
                        records.watchNumbers = watchNumbers
                        records.throwCounts = throwCounts
                        //重新设置records
                        roomInfo.setRoomRecords(records)
                        //更新room
                        roomUtil.updateRoom(res.room, roomInfo)
                    }
                    //推送消息
                    roomConnections.forEach(conn => {
                        if (conn === connection) {
                            const msg = new Message(
                                1,
                                conn.room,
                                conn.user,
                                {
                                    users: users,
                                    pokers: roomInfo?.getRoomRecords()?.pokers,
                                    currentGame: roomInfo?.getRoomRecords()?.currentGame,
                                    scores: roomInfo?.getRoomRecords()?.scores,
                                    userInfos: roomInfo?.getRoomRecords()?.userInfos,
                                    operations: roomInfo?.getRoomRecords()?.operations,
                                    followScore: roomInfo?.getRoomRecords().followScore,
                                    spokesman: roomInfo?.getRoomRecords().spokesman,
                                    innerScores: roomInfo?.getRoomRecords().innerScores,
                                    watchNumbers: roomInfo?.getRoomRecords().watchNumbers,
                                    opens: roomInfo?.getRoomRecords().opens,
                                    stuffies: roomInfo?.getRoomRecords().stuffies,
                                    throwCounts: roomInfo?.getRoomRecords().throwCounts
                                },
                                `你已加入房间`
                            )
                            conn.send(JSON.stringify(msg))
                        } else {
                            const msg = new Message(
                                1,
                                conn.room,
                                conn.user,
                                {
                                    users: users,
                                    pokers: roomInfo?.getRoomRecords()?.pokers,
                                    currentGame: roomInfo?.getRoomRecords()?.currentGame,
                                    scores: roomInfo?.getRoomRecords()?.scores,
                                    userInfos: roomInfo?.getRoomRecords()?.userInfos,
                                    operations: roomInfo?.getRoomRecords()?.operations,
                                    followScore: roomInfo?.getRoomRecords().followScore,
                                    spokesman: roomInfo?.getRoomRecords().spokesman,
                                    innerScores: roomInfo?.getRoomRecords().innerScores,
                                    throwCounts: roomInfo?.getRoomRecords().throwCounts
                                },
                                `${res.user.user_nickname}加入房间`
                            )
                            conn.send(JSON.stringify(msg))
                        }
                    })
                }
                await lockQueue(res.room, fn)
            }
            //游戏开始
            else if (res.type == 3) {
                const fn = async () => {
                    //获取该房间的所有连接
                    const roomConnections = server.connections.filter(item => {
                        return item.room == res.room
                    })
                    //人数判断
                    if (roomConnections.length <= 1) {
                        throw new Error('开始游戏必须不少于两个人')
                    }
                    let roomInfo = roomUtil.getRoom(res.room)
                    if (roomInfo) {
                        throw new Error('游戏已经开始了')
                    }
                    //从数据库中查询到房间信息
                    roomInfo = await RoomService.query(res.room)
                    //转为Room对象
                    roomInfo = roomUtil.initRoomObject(roomInfo)
                    //判断是否房主
                    if (roomInfo.room_creator != res.user.user_id) {
                        throw new Error('非房主不能开始游戏')
                    }
                    //获取用户数组
                    const users = roomConnections.map(item => {
                        return item.user
                    })
                    //更改房间状态
                    roomInfo.room_status = 1
                    //获取records
                    let records = roomInfo.getRoomRecords()
                    //记录当前局数
                    records.currentGame = 1
                    //初始化跟牌分数
                    records.followScore = FOLLOW_SCORE
                    //初始化发言人ID
                    records.spokesman = roomInfo.room_creator
                    //初始化该局分数
                    records.innerScores = users.length * BOTTOM_SCORE
                    //初始化每个用户的积分、牌组操作记录和闷牌次数、明牌上分次数、私人看牌次数
                    let scores = {}
                    let operations = {}
                    let stuffies = {}
                    let opens = {}
                    let watchNumbers = {}
                    let throwCounts = {}
                    users.forEach(item => {
                        scores[item.user_id] = -BOTTOM_SCORE
                        operations[item.user_id] = 0 //0表示没看牌，1表示看牌了，2表示弃牌
                        stuffies[item.user_id] = 0
                        opens[item.user_id] = 0
                        watchNumbers[item.user_id] = 0
                        throwCounts[item.user_id] = 0
                    })
                    //记录到records
                    records.scores = scores
                    records.operations = operations
                    records.stuffies = stuffies
                    records.opens = opens
                    records.userInfos = roomUtil.updateUserInfos(users)
                    records.watchNumbers = watchNumbers
                    records.throwCounts = throwCounts

                    //历史记录，用来存放每局结束时的数据
                    records.histories = []

                    //重新设置records
                    roomInfo.setRoomRecords(records)
                    //记录
                    roomUtil.updateRoom(res.room, roomInfo)
                    //发牌
                    roomUtil.licensingZJ(res.room, Object.keys(scores))
                    //重新获取
                    roomInfo = roomUtil.getRoom(res.room)
                    //推送
                    roomConnections.forEach(conn => {
                        const msg = new Message(
                            3,
                            conn.room,
                            conn.user,
                            {
                                users: users,
                                pokers: roomInfo.getRoomRecords().pokers,
                                currentGame: roomInfo.getRoomRecords().currentGame,
                                scores: roomInfo.getRoomRecords().scores,
                                userInfos: roomInfo.getRoomRecords().userInfos,
                                operations: roomInfo.getRoomRecords().operations,
                                followScore: roomInfo.getRoomRecords().followScore,
                                spokesman: roomInfo.getRoomRecords().spokesman,
                                innerScores: roomInfo.getRoomRecords().innerScores,
                                watchNumbers: roomInfo.getRoomRecords().watchNumbers,
                                opens: roomInfo.getRoomRecords().opens,
                                stuffies: roomInfo.getRoomRecords().stuffies,
                                throwCounts: roomInfo.getRoomRecords().throwCounts
                            },
                            '游戏开始，推送数据'
                        )
                        conn.send(JSON.stringify(msg))
                    })
                }
                await lockQueue(res.room, fn)
            }
            //上分
            else if (res.type == 4) {
                const fn = async () => {
                    console.log('用户ID:' + res.user.user_id + ',上分', res.num)
                    //获取上分倍数
                    const num = res.num || 1
                    //获取该房间的所有连接
                    const roomConnections = server.connections.filter(item => {
                        return item.room == res.room
                    })
                    //获取用户数组
                    const users = roomConnections.map(item => {
                        return item.user
                    })
                    //获取房间信息
                    let roomInfo = roomUtil.getRoom(res.room)
                    //获取records
                    let records = roomInfo.getRoomRecords()
                    //如果还没到你发言
                    if (records.spokesman != res.user.user_id) {
                        throw new Error('还没到你发言，请稍等')
                    }
                    //如果已经丢牌
                    if (records.operations[res.user.user_id] == 2) {
                        throw new Error('你已经丢牌，无法上分')
                    }
                    //获取没有丢牌的用户数组
                    const unDiscardUsers = roomUtil.getUnDiscardUsers(Object.keys(records.pokers), records.operations)
                    if (unDiscardUsers.length == 1) {
                        throw new Error('仅剩一人无法上分')
                    }
                    console.log('上分时私人看牌次数', records.watchNumbers[res.user.user_id])
                    //如果私下看过牌并且倍数大于1
                    if (records.watchNumbers[res.user.user_id] > 0 && num > 1) {
                        throw new Error('当前只能1倍上分噢')
                    }
                    //上分的分数=跟牌分数*倍数
                    let upScore = records.followScore * num
                    //上分大小限制
                    if (upScore > 2) {
                        throw new Error('最大跟盘分数为2分，不能再翻倍了')
                    }
                    if (records.operations[res.user.user_id] == 0 && records.stuffies[res.user.user_id] >= 5) {
                        throw new Error('每人最多不看牌上分5次')
                    }
                    //没有私下看过别人的牌，则正常处理
                    if (records.watchNumbers[res.user.user_id] == 0) {
                        //更新followScore
                        records.followScore = upScore
                        //如果已经看过牌了
                        if (records.operations[res.user.user_id] == 1) {
                            //该用户上分分数为双倍分数
                            upScore = upScore * 2
                            //增加一次明牌次数
                            records.opens[res.user.user_id] += 1
                        }
                        //如果没有看牌
                        else {
                            //增加闷牌次数
                            records.stuffies[res.user.user_id] += 1
                        }
                        //扣除用户分数
                        records.scores[res.user.user_id] = records.scores[res.user.user_id] - upScore
                        //增加盘内分数
                        records.innerScores += upScore
                    }
                    //已经私下看过牌了，则只增加一次明牌次数
                    else {
                        //该用户上分分数为双倍分数
                        upScore = upScore * 2
                        //增加一次明牌次数
                        records.opens[res.user.user_id] += 1
                    }
                    //获取新的发言人
                    const newSpokesman = roomUtil.getNewSpokesman(Object.keys(records.pokers), records.operations, records.spokesman)
                    records.spokesman = newSpokesman
                    //重置私人看牌次数
                    records.watchNumbers[newSpokesman] = 0
                    //重新设置records
                    roomInfo.setRoomRecords(records)
                    //记录
                    roomUtil.updateRoom(res.room, roomInfo)
                    //推送
                    roomConnections.forEach(conn => {
                        const msg = new Message(
                            4,
                            conn.room,
                            conn.user,
                            {
                                users: users,
                                pokers: roomInfo.getRoomRecords().pokers,
                                currentGame: roomInfo.getRoomRecords().currentGame,
                                scores: roomInfo.getRoomRecords().scores,
                                userInfos: roomInfo.getRoomRecords().userInfos,
                                operations: roomInfo.getRoomRecords().operations,
                                followScore: roomInfo.getRoomRecords().followScore,
                                spokesman: roomInfo.getRoomRecords().spokesman,
                                innerScores: roomInfo.getRoomRecords().innerScores,
                                stuffies: roomInfo.getRoomRecords().stuffies,
                                opens: roomInfo.getRoomRecords().opens,
                                watchNumbers: roomInfo.getRoomRecords().watchNumbers
                            },
                            conn === connection ? `${upScore}分` : `${res.user.user_nickname}：${upScore}分`
                        )
                        if (roomUtil.isInUserInfos(conn.user, roomInfo.getRoomRecords().userInfos)) {
                            conn.send(JSON.stringify(msg))
                        }
                    })
                }
                await lockQueue(res.room, fn)
            }
            //看牌
            else if (res.type == 5) {
                const fn = async () => {
                    //获取该房间的所有连接
                    const roomConnections = server.connections.filter(item => {
                        return item.room == res.room
                    })
                    //获取用户数组
                    const users = roomConnections.map(item => {
                        return item.user
                    })
                    let roomInfo = roomUtil.getRoom(res.room)
                    //获取records
                    let records = roomInfo.getRoomRecords()
                    //如果还没到你发言
                    if (records.spokesman != res.user.user_id) {
                        throw new Error('还没到你发言，请稍等')
                    }
                    //不是没看牌的状态
                    if (records.operations[res.user.user_id] != 0) {
                        throw new Error('你已经看过牌或者丢牌了')
                    }
                    //更新牌操作状态为看牌
                    records.operations[res.user.user_id] = 1
                    //重新设置records
                    roomInfo.setRoomRecords(records)
                    //记录
                    roomUtil.updateRoom(res.room, roomInfo)
                    //推送
                    roomConnections.forEach(conn => {
                        const msg = new Message(
                            5,
                            conn.room,
                            conn.user,
                            {
                                users: users,
                                pokers: roomInfo.getRoomRecords().pokers,
                                currentGame: roomInfo.getRoomRecords().currentGame,
                                scores: roomInfo.getRoomRecords().scores,
                                userInfos: roomInfo.getRoomRecords().userInfos,
                                operations: roomInfo.getRoomRecords().operations,
                                followScore: roomInfo.getRoomRecords().followScore,
                                spokesman: roomInfo.getRoomRecords().spokesman,
                                innerScores: roomInfo.getRoomRecords().innerScores,
                                stuffies: roomInfo.getRoomRecords().stuffies,
                                opens: roomInfo.getRoomRecords().opens,
                                watchNumbers: roomInfo.getRoomRecords().watchNumbers
                            },
                            `${res.user.user_nickname}看牌`
                        )
                        if (roomUtil.isInUserInfos(conn.user, roomInfo.getRoomRecords().userInfos)) {
                            conn.send(JSON.stringify(msg))
                        }
                    })
                }
                await lockQueue(res.room, fn)
            }
            //丢牌
            else if (res.type == 6) {
                const fn = async () => {
                    //获取该房间的所有连接
                    const roomConnections = server.connections.filter(item => {
                        return item.room == res.room
                    })
                    //获取用户数组
                    const users = roomConnections.map(item => {
                        return item.user
                    })
                    //获取房间信息
                    let roomInfo = roomUtil.getRoom(res.room)
                    //获取records
                    let records = roomInfo.getRoomRecords()
                    //如果还没到你发言
                    if (records.spokesman != res.user.user_id) {
                        throw new Error('还没到你发言，请稍等')
                    }
                    //已丢牌状态
                    if (records.operations[res.user.user_id] == 2) {
                        throw new Error('你已丢牌，无须重复丢牌')
                    }
                    //获取没有丢牌的用户
                    let unDiscardUsers = roomUtil.getUnDiscardUsers(Object.keys(records.pokers), records.operations)
                    if (unDiscardUsers.length == 1) {
                        throw new Error('其他人都已经丢牌了，你无法丢牌')
                    }
                    //更新牌操作状态为丢牌
                    records.operations[res.user.user_id] = 2
                    //获取新的发言人
                    const newSpokesman = roomUtil.getNewSpokesman(Object.keys(records.pokers), records.operations, records.spokesman)
                    //重置新的发言人
                    records.spokesman = newSpokesman
                    //重置私人看牌次数
                    records.watchNumbers[newSpokesman] = 0
                    //重新设置records
                    roomInfo.setRoomRecords(records)
                    //记录
                    roomUtil.updateRoom(res.room, roomInfo)
                    //再次获取未丢牌用户
                    unDiscardUsers = roomUtil.getUnDiscardUsers(Object.keys(records.pokers), records.operations)
                    //如果只有一个用户没有丢牌则执行计算分数
                    if (unDiscardUsers.length == 1) {
                        //更新没有丢牌的那个用户为已看牌
                        records.operations[unDiscardUsers[0]] = 1
                        //重置spokesman
                        records.spokesman = null
                        //重新设置records
                        roomInfo.setRoomRecords(records)
                        //执行计算逻辑
                        doCountScore(res, connection, server)
                    }
                    //推送
                    roomConnections.forEach(conn => {
                        const msg = new Message(
                            6,
                            conn.room,
                            conn.user,
                            {
                                users: users,
                                pokers: roomInfo.getRoomRecords().pokers,
                                currentGame: roomInfo.getRoomRecords().currentGame,
                                scores: roomInfo.getRoomRecords().scores,
                                userInfos: roomInfo.getRoomRecords().userInfos,
                                operations: roomInfo.getRoomRecords().operations,
                                followScore: roomInfo.getRoomRecords().followScore,
                                spokesman: roomInfo.getRoomRecords().spokesman,
                                innerScores: roomInfo.getRoomRecords().innerScores,
                                stuffies: roomInfo.getRoomRecords().stuffies,
                                opens: roomInfo.getRoomRecords().opens,
                                watchNumbers: roomInfo.getRoomRecords().watchNumbers,
                                unDiscardUsers: unDiscardUsers,
                                isSelf: conn === connection
                            },
                            `${res.user.user_nickname}已丢牌`
                        )
                        if (roomUtil.isInUserInfos(conn.user, roomInfo.getRoomRecords().userInfos)) {
                            conn.send(JSON.stringify(msg))
                        }
                    })
                }
                await lockQueue(res.room, fn)
            }
            //见面
            else if (res.type == 8) {
                const fn = async () => {
                    //获取该房间的所有连接
                    const roomConnections = server.connections.filter(item => {
                        return item.room == res.room
                    })
                    //获取用户数组
                    const users = roomConnections.map(item => {
                        return item.user
                    })
                    //获取房间信息
                    let roomInfo = roomUtil.getRoom(res.room)
                    //获取records
                    let records = roomInfo.getRoomRecords()
                    //如果还没到你发言
                    if (records.spokesman != res.user.user_id) {
                        throw new Error('还没到你发言，请稍等')
                    }
                    //丢牌处理
                    if (records.operations[res.user.user_id] == 2) {
                        throw new Error('你已丢牌无法见面')
                    }
                    //获取没有丢牌的用户
                    let unDiscardUsers = roomUtil.getUnDiscardUsers(Object.keys(records.pokers), records.operations)
                    if (unDiscardUsers.length > 2) {
                        throw new Error('超过2人在场无法见面')
                    }
                    if (unDiscardUsers.length == 1) {
                        throw new Error('仅剩一人无法见面')
                    }
                    let upScore = records.followScore
                    //已经看过牌了，则双倍
                    if (records.operations[res.user.user_id] == 1) {
                        upScore = upScore * 2
                        //增加明牌次数
                        records.opens[res.user.user_id] += 1
                    } else {
                        //增加闷牌次数
                        records.stuffies[res.user.user_id] += 1
                    }
                    //扣除用户分数
                    records.scores[res.user.user_id] = records.scores[res.user.user_id] - upScore
                    //增加盘内分数
                    records.innerScores += upScore
                    //重置spokesman
                    records.spokesman = null
                    //重新设置records
                    roomInfo.setRoomRecords(records)
                    //记录
                    roomUtil.updateRoom(res.room, roomInfo)
                    //推送
                    roomConnections.forEach(conn => {
                        const msg = new Message(
                            8,
                            conn.room,
                            conn.user,
                            {
                                users: users,
                                pokers: roomInfo.getRoomRecords().pokers,
                                currentGame: roomInfo.getRoomRecords().currentGame,
                                scores: roomInfo.getRoomRecords().scores,
                                userInfos: roomInfo.getRoomRecords().userInfos,
                                operations: roomInfo.getRoomRecords().operations,
                                followScore: roomInfo.getRoomRecords().followScore,
                                spokesman: roomInfo.getRoomRecords().spokesman,
                                innerScores: roomInfo.getRoomRecords().innerScores,
                                stuffies: roomInfo.getRoomRecords().stuffies,
                                opens: roomInfo.getRoomRecords().opens,
                                watchNumbers: roomInfo.getRoomRecords().watchNumbers
                            },
                            conn === connection ? '见面请求已发送' : `${res.user.user_nickname}请求见面`
                        )
                        if (roomUtil.isInUserInfos(conn.user, roomInfo.getRoomRecords().userInfos)) {
                            conn.send(JSON.stringify(msg))
                        }
                    })
                    //执行计算
                    doCountScore(res, connection, server)
                }
                await lockQueue(res.room, fn)
            }
            //解散房间
            else if (res.type == 10) {
                const fn = async () => {
                    //获取房间信息
                    let roomInfo = await RoomService.query(res.room)
                    roomInfo = roomUtil.initRoomObject(roomInfo)
                    if (roomInfo.room_creator != res.user.user_id) {
                        throw new Error('非房主无法解散房间')
                    }
                    //解散房间
                    await RoomService.dissolution(res.room)
                    //清空缓存中的roomInfo
                    const cacheRoom = roomUtil.getRoom(res.room)
                    if (cacheRoom) {
                        roomUtil.removeRoom(res.room)
                    }
                    //获取该房间的所有连接
                    const roomConnections = server.connections.filter(item => {
                        return item.room == res.room
                    })
                    //获取用户数组
                    const users = roomConnections.map(item => {
                        return item.user
                    })
                    //推送
                    roomConnections.forEach(conn => {
                        const msg = new Message(
                            10,
                            conn.room,
                            conn.user,
                            {
                                users: users
                            },
                            `房间已解散`
                        )
                        conn.send(JSON.stringify(msg))
                    })
                }
                await lockQueue(res.room, fn)
            }
            //接收快捷消息
            else if (res.type == 11) {
                let content = res.content
                if (!content) {
                    return
                }
                //获取该房间的所有连接
                const roomConnections = server.connections.filter(item => {
                    return item.room == res.room
                })
                //获取用户数组
                const users = roomConnections.map(item => {
                    return item.user
                })
                let roomInfo = roomUtil.getRoom(res.room)
                //推送快捷消息
                roomConnections.forEach(conn => {
                    const msg = new Message(
                        11,
                        conn.room,
                        conn.user,
                        {
                            users: users,
                            content: content,
                            belongUser: res.user
                        },
                        `${res.user.user_nickname}发送了快捷消息`
                    )
                    if (roomUtil.isInUserInfos(conn.user, roomInfo.getRoomRecords().userInfos)) {
                        conn.send(JSON.stringify(msg))
                    }
                })
            }
            //接收丢球通知
            else if (res.type == 12) {
                const targetUser = res.targetUser
                //获取该房间的所有连接
                const roomConnections = server.connections.filter(item => {
                    return item.room == res.room
                })
                //获取用户数组
                const users = roomConnections.map(item => {
                    return item.user
                })
                let roomInfo = roomUtil.getRoom(res.room)
                let records = roomInfo.getRoomRecords()
                if (records.throwCounts[res.user.user_id] >= 20) {
                    throw new Error('丢球丢多了容易累，歇会哈')
                }
                //更新丢球数
                records.throwCounts[res.user.user_id]++
                //设置roomRecords
                roomInfo.setRoomRecords(records)
                //记录
                roomUtil.updateRoom(res.room, roomInfo)
                //推送丢球通知
                roomConnections.forEach(conn => {
                    const msg = new Message(
                        12,
                        conn.room,
                        conn.user,
                        {
                            users: users,
                            targetUser: targetUser,
                            selfUser: res.user,
                            throwCounts: roomInfo.getRoomRecords().throwCounts
                        },
                        `${res.user.user_nickname}向${targetUser.user_nickname}丢球`
                    )
                    if (roomUtil.isInUserInfos(conn.user, roomInfo.getRoomRecords().userInfos)) {
                        conn.send(JSON.stringify(msg))
                    }
                })
            }
            //接收私人看牌
            else if (res.type == 13) {
                const targetUser = res.targetUser
                //获取该房间的所有连接
                const roomConnections = server.connections.filter(item => {
                    return item.room == res.room
                })
                //获取用户数组
                const users = roomConnections.map(item => {
                    return item.user
                })
                //获取房间信息
                let roomInfo = roomUtil.getRoom(res.room)
                //获取records
                let records = roomInfo.getRoomRecords()
                if (records.spokesman != res.user.user_id) {
                    throw new Error('还没到你发言无法查看他人的牌')
                }
                if (records.operations[res.user.user_id] == 2) {
                    throw new Error('你已丢牌无法查看他人的牌')
                }
                if (records.operations[res.user.user_id] == 0) {
                    throw new Error('你还没看牌，无法查看别人的牌')
                }
                //获取没有丢牌的用户
                let unDiscardUsers = roomUtil.getUnDiscardUsers(Object.keys(records.pokers), records.operations)
                if (unDiscardUsers.length <= 2) {
                    throw new Error('场上人数不少于2人时才可以看牌')
                }
                if (records.watchNumbers[res.user.user_id] >= 1) {
                    throw new Error('每人每次发言只有一次私下看牌机会噢')
                }
                //是否有人还在闷牌
                const hasNoWatch = Object.keys(records.operations).some(key => {
                    return records.operations[key] == 0
                })
                if (hasNoWatch) {
                    throw new Error('只有场上所有人都看牌过才允许私下看牌')
                }
                //因为是看过牌的才能看别人牌，所以*2
                let upScore = records.followScore * 2
                //增加明牌次数
                records.opens[res.user.user_id] += 1
                //扣除用户分数
                records.scores[res.user.user_id] = records.scores[res.user.user_id] - upScore
                //增加盘内分数
                records.innerScores += upScore
                //增加私人看牌次数
                records.watchNumbers[res.user.user_id] += 1
                //获取指定用户的牌
                const targetPokers = records.pokers[targetUser.user_id]
                //重新设置records
                roomInfo.setRoomRecords(records)
                //记录
                roomUtil.updateRoom(res.room, roomInfo)
                //推送私人看牌通知
                roomConnections.forEach(conn => {
                    const msg = new Message(
                        13,
                        conn.room,
                        conn.user,
                        {
                            users: users,
                            pokers: roomInfo.getRoomRecords().pokers,
                            currentGame: roomInfo.getRoomRecords().currentGame,
                            scores: roomInfo.getRoomRecords().scores,
                            userInfos: roomInfo.getRoomRecords().userInfos,
                            operations: roomInfo.getRoomRecords().operations,
                            followScore: roomInfo.getRoomRecords().followScore,
                            spokesman: roomInfo.getRoomRecords().spokesman,
                            innerScores: roomInfo.getRoomRecords().innerScores,
                            stuffies: roomInfo.getRoomRecords().stuffies,
                            opens: roomInfo.getRoomRecords().opens,
                            watchNumbers: roomInfo.getRoomRecords().watchNumbers,
                            targetPokers: targetPokers,
                            targetUser: targetUser,
                            isSelf: connection === conn
                        },
                        `${res.user.user_nickname}查看了${targetUser.user_nickname}的牌`
                    )
                    if (roomUtil.isInUserInfos(conn.user, roomInfo.getRoomRecords().userInfos)) {
                        conn.send(JSON.stringify(msg))
                    }
                })
            }
        } catch (error) {
            console.log(error)
            //如果是ServiceError则需要告知前端刷新页面
            if (error.name == 'ServiceError') {
                sendErrorMsg(connection, error.message, true)
            } else {
                sendErrorMsg(connection, error.message, false)
            }
        }
    },
    //出现异常
    error(code, connection, server) {
        connection.close()
    },
    //连接关闭
    async close(code, connection, server) {
        try {
            if (!connection.user) {
                return
            }
            const fn = async () => {
                //获取该房间的所有连接
                const roomConnections = server.connections.filter(item => {
                    return item.room == connection.room
                })
                //获取用户数组
                const users = roomConnections.map(item => {
                    return item.user
                })
                //获取房间信息
                const roomInfo = roomUtil.getRoom(connection.room)
                if (roomInfo) {
                    //如果房间在游戏中
                    if (roomInfo.room_status == 1) {
                        //获取records
                        let records = roomInfo.getRoomRecords()
                        console.log('房间对局中，用户离开房间', connection.user.user_id, records.pokers[connection.user.user_id])
                        //如果还没有给这个用户发牌，则删除他的初始化信息
                        if (!records.pokers[connection.user.user_id]) {
                            let scores = records.scores
                            let userInfos = records.userInfos
                            let operations = records.operations
                            let stuffies = records.stuffies
                            let opens = records.opens
                            let watchNumbers = records.watchNumbers
                            delete scores[connection.user.user_id]
                            delete operations[connection.user.user_id]
                            delete stuffies[connection.user.user_id]
                            delete opens[connection.user.user_id]
                            delete watchNumbers[connection.user.user_id]
                            userInfos = userInfos.filter(item => {
                                return item.user_id != connection.user.user_id
                            })
                            records.scores = scores
                            records.userInfos = userInfos
                            records.operations = operations
                            records.stuffies = stuffies
                            records.opens = opens
                            records.watchNumbers = watchNumbers
                            //重新设置records
                            roomInfo.setRoomRecords(records)
                            //更新room
                            roomUtil.updateRoom(connection.room, roomInfo)
                        }
                    }
                    roomConnections.forEach(conn => {
                        if (conn != connection) {
                            const msg = new Message(
                                2,
                                conn.room,
                                conn.user,
                                {
                                    users: users,
                                    pokers: roomInfo.getRoomRecords().pokers,
                                    currentGame: roomInfo.getRoomRecords().currentGame,
                                    scores: roomInfo.getRoomRecords().scores,
                                    userInfos: roomInfo.getRoomRecords().userInfos,
                                    operations: roomInfo.getRoomRecords().operations,
                                    followScore: roomInfo.getRoomRecords().followScore,
                                    spokesman: roomInfo.getRoomRecords().spokesman,
                                    innerScores: roomInfo.getRoomRecords().innerScores,
                                    stuffies: roomInfo.getRoomRecords().stuffies,
                                    opens: roomInfo.getRoomRecords().opens,
                                    watchNumbers: roomInfo.getRoomRecords().watchNumbers
                                },
                                `${connection.user.user_nickname}离开了聊天室`
                            )
                            conn.send(JSON.stringify(msg))
                        }
                    })
                } else {
                    roomConnections.forEach(conn => {
                        if (conn != connection) {
                            const msg = new Message(
                                2,
                                conn.room,
                                conn.user,
                                {
                                    users: users
                                },
                                `${connection.user.user_nickname}离开了聊天室`
                            )
                            conn.send(JSON.stringify(msg))
                        }
                    })
                }
            }
            await lockQueue(connection.room, fn)
        } catch (error) {
            console.log(error)
            //如果是ServiceError则需要告知前端刷新页面
            if (error.name == 'ServiceError') {
                sendErrorMsg(connection, error.message, true)
            } else {
                sendErrorMsg(connection, error.message, false)
            }
        }
    }
}
