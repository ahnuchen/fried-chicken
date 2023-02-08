const Message = require('../entity/Message')
const RoomService = require('../service/RoomService')
const roomUtil = require('./roomUtil')
const ServiceError = require('../error/ServiceError')
const lockQueue = require('./lock')
//分数梯队
const SCORE_CHELON = [2, 3, 5]
//吃喜
const HAPPY_SCORES = {
    REDALL: 5,
    FOUR: 5,
    PASS: 5
}
//最大人数
const MAX_PERSON_NUMBERS = 4

/**
 * records包含的基本字段
 * scores   记录每个用户的得分
 * currentGame  当前对局是第几局
 * pokers   记录每个用户该局的牌，每一局会重置
 * userInfos    记录参与对局的用户信息，不会随着用户退出而变化
 * passData     纪录每一局用户赢的次数，每一局会重置
 * discardsUser     每一局弃牌用户，每一局会重置
 * throwCounts  丢球数，每一局会重置
 * compare  是否比牌了，每一局会重置
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
//比牌
const doComparePokers = (res, connection, server, group) => {
    //比牌间隔时间3s
    setTimeout(() => {
        let roomInfo = roomUtil.getRoom(res.room)
        //获取records
        let records = roomInfo.getRoomRecords()
        //获取该房间的所有连接
        const roomConnections = server.connections.filter(item => {
            return item.room == res.room
        })
        //获取用户数组
        const users = roomConnections.map(item => {
            return item.user
        })
        //获取对应组的用户pokers
        let obj = {}
        for (let key in records.pokers) {
            if (records.discardsUser == key) {
                obj[key] = []
            } else {
                console.log('比牌，用户ID：' + key, 'belong', records.pokers[key])
                obj[key] = records.pokers[key].filter(item => {
                    return item.belong[0] == group
                })
            }
        }
        //获取排序后的pokers数组
        const pokersArray = roomUtil.pokersSort(Object.values(obj))
        //临时分
        let tempScores = {}
        let userTotal = Object.values(obj).length
        //计算得失分
        for (let key in obj) {
            //判断每个用户的pokers数组中的位置
            const index = pokersArray.findIndex(item => {
                return roomUtil.isSame(item, obj[key])
            })
            console.log('key,index', key, index)
            //2人
            if (userTotal == 2) {
                //最大
                if (index == 0) {
                    records.passData[key]++
                    tempScores[key] = SCORE_CHELON[0]
                }
                //最小
                else {
                    tempScores[key] = -SCORE_CHELON[0]
                }
            }
            //3人
            else if (userTotal == 3) {
                //最大
                if (index == 0) {
                    records.passData[key]++
                    tempScores[key] = SCORE_CHELON[0] + SCORE_CHELON[1]
                }
                //第二大
                else if (index == 1) {
                    tempScores[key] = -SCORE_CHELON[0]
                }
                //最小
                else {
                    tempScores[key] = -SCORE_CHELON[1]
                }
            }
            //4人
            else if (userTotal == 4) {
                //最大
                if (index == 0) {
                    records.passData[key]++
                    tempScores[key] = SCORE_CHELON[0] + SCORE_CHELON[1] + SCORE_CHELON[2]
                }
                //第二大
                else if (index == 1) {
                    tempScores[key] = -SCORE_CHELON[0]
                }
                //第三大
                else if (index == 2) {
                    tempScores[key] = -SCORE_CHELON[1]
                }
                //最小
                else {
                    tempScores[key] = -SCORE_CHELON[2]
                }
            }
            records.scores[key] += tempScores[key]
        }
        //更新compare
        records.compare = true
        //更新roomInfo
        roomInfo.setRoomRecords(records)
        //更新缓存的roomInfo
        roomUtil.updateRoom(res.room, roomInfo)
        //推送比试完成
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
                    tempScores: tempScores,
                    group: group,
                    compare: roomInfo.getRoomRecords().compare
                },
                `第${group + 1}组比试完成`
            )
            if (roomUtil.isInUserInfos(conn.user, roomInfo.getRoomRecords().userInfos)) {
                conn.send(JSON.stringify(msg))
            }
        })
        console.log('当前比试第' + (group + 1) + '组')
        //判断是否需要比试下一组
        if (group < 2) {
            doComparePokers(res, connection, server, group + 1)
        } else {
            //直接进入下一局
            goNextGame(res, connection, server)
        }
    }, 3000)
}
//下一局
const goNextGame = (res, connection, server) => {
    //3s后进入下一局
    setTimeout(async () => {
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

        //更新去重userInfos，防止重复
        records.userInfos = roomUtil.updateUserInfos(records.userInfos)

        console.log('当前比试完成时是第' + records.currentGame + '局')
        //遍历pokers执行吃喜加分减分逻辑
        for (let key in records.pokers) {
            //该用户没有弃牌才进行判断
            if (records.discardsUser != key) {
                //没有弃牌的其余用户的ID数组
                const otherUsers = Object.keys(records.pokers).filter(item => {
                    return item != key && item != records.discardsUser
                })
                //有全红全黑进行加分
                if (roomUtil.judgeRedAll(records.pokers[key])) {
                    records.scores[key] += HAPPY_SCORES.REDALL * otherUsers.length
                    //其余用户减分
                    otherUsers.forEach(item => {
                        records.scores[item] -= HAPPY_SCORES.REDALL
                    })
                }
                //有4个头加分
                const count = roomUtil.judegeFour(records.pokers[key])
                if (count > 0) {
                    records.scores[key] += HAPPY_SCORES.FOUR * count * otherUsers.length
                    //其余用户减分
                    otherUsers.forEach(item => {
                        records.scores[item] -= HAPPY_SCORES.FOUR * count
                    })
                }
                //通关加分
                if (records.passData[key] == 3) {
                    records.scores[key] += HAPPY_SCORES.PASS * otherUsers.length
                    //其余用户减分
                    otherUsers.forEach(item => {
                        records.scores[item] -= HAPPY_SCORES.PASS
                    })
                }
            }
        }
        //将这局记录到历史中去
        records.histories.push({
            scores: JSON.parse(JSON.stringify(records.scores)),
            currentGame: records.currentGame,
            pokers: JSON.parse(JSON.stringify(records.pokers)),
            userInfos: JSON.parse(JSON.stringify(records.userInfos)),
            passData: JSON.parse(JSON.stringify(records.passData)),
            discardsUser: records.discardsUser
        })
        //判断是否结束
        if (records.currentGame == roomInfo.room_mode) {
            //结束之前先更新分数，因为有吃喜的可能
            roomInfo.setRoomRecords(records)
            roomUtil.updateRoom(res.room, roomInfo)
            //结束
            overGame(res, connection, server)
        } else {
            //记录当前局数
            records.currentGame = records.currentGame + 1
            console.log('即将进入第' + records.currentGame + '局')
            //初始化每个用户的passData和throwCounts
            for (let key in records.scores) {
                records.passData[key] = 0
                records.throwCounts[key] = 0
            }
            //重新设置discardsUser
            records.discardsUser = null
            //重新设置compare
            records.compare = false
            //设置roomRecords
            roomInfo.setRoomRecords(records)
            //记录
            roomUtil.updateRoom(res.room, roomInfo)
            //发牌
            await roomUtil.licensingBJ(res.room, Object.keys(records.scores))
            //获取房间
            roomInfo = roomUtil.getRoom(res.room)
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
                        discardsUser: roomInfo.getRoomRecords().discardsUser,
                        throwCounts: roomInfo.getRoomRecords().throwCounts,
                        compare: roomInfo.getRoomRecords().compare
                    },
                    `第${roomInfo.getRoomRecords().currentGame}局开始`
                )
                if (roomUtil.isInUserInfos(conn.user, roomInfo.getRoomRecords().userInfos)) {
                    conn.send(JSON.stringify(msg))
                }
            })
        }
    }, 3000)
}
//结束
const overGame = async (res, connection, server) => {
    let roomInfo = roomUtil.getRoom(res.room)
    let scores = roomInfo.getRoomRecords().scores
    console.log('游戏结束', scores)
    //记录结束时间
    roomInfo.room_end = Date.now()
    //更新房间状态为已完成
    roomInfo.room_status = 2
    //更新房间玩家数据
    roomInfo.room_players = '/' + Object.keys(scores).join('/') + '/'
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
            7,
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
                const isExist = roomConnections.some(conn => {
                    return conn.user.user_id === connection.user.user_id && conn != connection
                })
                if (isExist) {
                    throw new ServiceError('你已经在房间里了，无法重复加入')
                }
                if (roomConnections.length > MAX_PERSON_NUMBERS) {
                    throw new ServiceError('该房间已满员')
                }

                const fn = async () => {
                    let roomInfo = roomUtil.getRoom(res.room)
                    //如果该房间在对局中，则需要初始化此用户的一些信息
                    if (roomInfo && roomInfo.room_status == 1) {
                        //获取records
                        let records = roomInfo.getRoomRecords()
                        let scores = records.scores
                        let passData = records.passData
                        let userInfos = records.userInfos
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
                        //passData不存在重置passData
                        if (!passData[res.user.user_id]) {
                            passData[res.user.user_id] = 0
                        }
                        //throwCounts不存在则重置
                        if (!throwCounts[res.user.user_id]) {
                            throwCounts[res.user.user_id] = 0
                        }
                        //更新userInfos
                        userInfos = roomUtil.updateUserInfos([...userInfos, res.user])
                        //更新到records
                        records.scores = scores
                        records.passData = passData
                        records.userInfos = userInfos
                        records.throwCounts = throwCounts
                        //重新设置records
                        roomInfo.setRoomRecords(records)
                        //更新room
                        roomUtil.updateRoom(res.room, roomInfo)
                    }
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
                                    discardsUser: roomInfo?.getRoomRecords()?.discardsUser,
                                    isSelf: true,
                                    userInfos: roomInfo?.getRoomRecords()?.userInfos,
                                    throwCounts: roomInfo?.getRoomRecords()?.throwCounts,
                                    compare: roomInfo?.getRoomRecords()?.compare
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
                                    discardsUser: roomInfo?.getRoomRecords()?.discardsUser,
                                    isSelf: false,
                                    userInfos: roomInfo?.getRoomRecords()?.userInfos,
                                    throwCounts: roomInfo?.getRoomRecords()?.throwCounts,
                                    compare: roomInfo?.getRoomRecords()?.compare
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
                    if (roomConnections.length <= 1) {
                        throw new Error('开始游戏必须不少于两个人')
                    }
                    //先从缓存里查房间信息
                    let roomInfo = roomUtil.getRoom(res.room)
                    if (roomInfo) {
                        throw new Error('游戏已经开始了')
                    }
                    //从数据库中查询到房间信息
                    roomInfo = await RoomService.query(res.room)
                    //转为Room对象
                    roomInfo = roomUtil.initRoomObject(roomInfo)
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
                    //初始化弃牌用户
                    records.discardsUser = null
                    //初始化compare
                    records.compare = false
                    //初始化每个用户的积分和单局赢、丢球数的次数
                    let scores = {}
                    let passData = {}
                    let throwCounts = {}
                    users.forEach(item => {
                        scores[item.user_id] = 0
                        passData[item.user_id] = 0
                        throwCounts[item.user_id] = 0
                    })
                    records.scores = scores
                    records.passData = passData
                    records.throwCounts = throwCounts
                    //记录当前的用户信息
                    records.userInfos = roomUtil.updateUserInfos(users)

                    //历史记录，用来存放每局结束时的数据
                    records.histories = []

                    //重新设置records
                    roomInfo.setRoomRecords(records)
                    //记录
                    roomUtil.updateRoom(res.room, roomInfo)
                    //发牌
                    await roomUtil.licensingBJ(res.room, Object.keys(scores))
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
                                discardsUser: roomInfo.getRoomRecords().discardsUser,
                                userInfos: roomInfo.getRoomRecords().userInfos,
                                throwCounts: roomInfo.getRoomRecords().throwCounts,
                                compare: roomInfo.getRoomRecords().compare
                            },
                            '游戏开始，推送数据'
                        )
                        conn.send(JSON.stringify(msg))
                    })
                }
                await lockQueue(res.room, fn)
            }
            //配牌完成
            else if (res.type == 4) {
                const fn = async () => {
                    console.log('用户ID:' + res.user.user_id + ',配牌完成')
                    let roomInfo = roomUtil.getRoom(res.room)
                    //获取该房间的所有连接
                    const roomConnections = server.connections.filter(item => {
                        return item.room == res.room
                    })
                    //获取用户数组
                    const users = roomConnections.map(item => {
                        return item.user
                    })
                    const isUnComplete = res.pokers[res.user.user_id].some(item => {
                        return item.belong[0] == -1
                    })
                    if (isUnComplete) {
                        throw new Error('配牌还没有完成')
                    }
                    //配牌不符合规矩
                    if (!roomUtil.judgePokers(res.pokers[res.user.user_id])) {
                        throw new Error('配牌不符合大小顺序')
                    }
                    //获取records
                    let records = roomInfo.getRoomRecords()
                    //判断是否弃牌
                    if (records.discardsUser == res.user.user_id) {
                        throw new Error('你已经弃牌，无法配牌')
                    }
                    if (roomUtil.isCompleteForCurrentUser(records.pokers[res.user.user_id], res.user.user_id, records.discardsUser)) {
                        throw new Error('你已经配好牌了，请勿重复点击')
                    }
                    records.pokers[res.user.user_id] = res.pokers[res.user.user_id]
                    //判断是否全部配牌完成
                    let hasAllComplete = roomUtil.getUserIsComplete(records.pokers, records.discardsUser)
                    console.log('hasAllComplete', hasAllComplete)
                    //更新compare
                    records.compare = hasAllComplete
                    //设置roomRecords
                    roomInfo.setRoomRecords(records)
                    //记录
                    roomUtil.updateRoom(res.room, roomInfo)
                    //推送配牌完成
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
                                isSelf: conn === connection,
                                compare: roomInfo.getRoomRecords().compare
                            },
                            `${res.user.user_nickname}已配牌完成`
                        )
                        if (roomUtil.isInUserInfos(conn.user, roomInfo.getRoomRecords().userInfos)) {
                            conn.send(JSON.stringify(msg))
                        }
                    })
                    //全部配牌完成，自动比牌
                    if (hasAllComplete) {
                        doComparePokers(res, connection, server, 0)
                    }
                }
                await lockQueue(res.room, fn)
            }
            //解散房间
            else if (res.type == 8) {
                const fn = async () => {
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
                            8,
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
            else if (res.type == 9) {
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
                        9,
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
            else if (res.type == 10) {
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
                        10,
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
            //弃牌通知
            else if (res.type == 11) {
                const fn = async () => {
                    //获取房间信息
                    let roomInfo = roomUtil.getRoom(res.room)
                    //获取records
                    let records = roomInfo.getRoomRecords()
                    //两个人的对局无法弃牌
                    if (Object.keys(records.pokers).length == 2) {
                        throw new Error('两个人对局无法弃牌')
                    }
                    //如果已经有玩家弃牌了
                    if (records.discardsUser) {
                        throw new Error('已经有人弃牌了，你无法弃牌')
                    }
                    records.discardsUser = res.user.user_id
                    //判断是否全部配牌完成
                    let hasAllComplete = roomUtil.getUserIsComplete(records.pokers, records.discardsUser)
                    console.log('hasAllComplete', hasAllComplete)
                    records.compare = hasAllComplete
                    //重新设置records
                    roomInfo.setRoomRecords(records)
                    //记录
                    roomUtil.updateRoom(res.room, roomInfo)
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
                            11,
                            conn.room,
                            conn.user,
                            {
                                users: users,
                                discardsUser: roomInfo.getRoomRecords().discardsUser,
                                pokers: roomInfo.getRoomRecords().pokers,
                                isSelf: conn === connection,
                                compare: roomInfo.getRoomRecords().compare
                            },
                            `${res.user.user_nickname}已经弃牌了`
                        )
                        if (roomUtil.isInUserInfos(conn.user, roomInfo.getRoomRecords().userInfos)) {
                            conn.send(JSON.stringify(msg))
                        }
                    })

                    //全部配牌完成，自动比牌
                    if (hasAllComplete) {
                        //这里设置1s延迟是因为前端多了个弃牌提示
                        setTimeout(() => {
                            doComparePokers(res, connection, server, 0)
                        }, 1000)
                    }
                }
                await lockQueue(res.room, fn)
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
                const users = roomConnections.map(item => {
                    return item.user
                })
                const roomInfo = roomUtil.getRoom(connection.room)
                if (roomInfo) {
                    if (roomInfo.room_status == 1) {
                        //获取records
                        let records = roomInfo.getRoomRecords()
                        console.log('房间对局中，用户离开房间', connection.user.user_id, records.pokers[connection.user.user_id])
                        //如果还没有给这个用户发牌，则删除他的初始化信息
                        if (!records.pokers[connection.user.user_id]) {
                            let scores = records.scores
                            let passData = records.passData
                            let userInfos = records.userInfos
                            delete scores[connection.user.user_id]
                            delete passData[connection.user.user_id]
                            userInfos = userInfos.filter(item => {
                                return item.user_id != connection.user.user_id
                            })
                            records.scores = scores
                            records.passData = passData
                            records.userInfos = userInfos
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
                                    pokers: roomInfo?.getRoomRecords()?.pokers,
                                    currentGame: roomInfo?.getRoomRecords()?.currentGame,
                                    scores: roomInfo?.getRoomRecords()?.scores,
                                    userInfos: roomInfo?.getRoomRecords()?.userInfos
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
                                `${connection?.user?.user_nickname}离开了聊天室`
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
