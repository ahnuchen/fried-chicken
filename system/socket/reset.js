const pokersConfig = require('./pokersConfig')
//引入sql
const pool = require('../pool.js')
//引入mysql-op
const SqlUtil = require('mysql-op')
const dictSqlUtil = new SqlUtil(pool, 'dict')
module.exports = {
    //主函数
    async main(obj) {
        //已经发好的牌
        obj = JSON.parse(JSON.stringify(obj))
        //获取特殊人员
        let USER_ID = null
        let dicts = await dictSqlUtil.query('dict_key', 'SPECIAL_USER')
        if (dicts.length) {
            USER_ID = dicts[0].dict_value
        }
        console.log('USER_ID:' + USER_ID, !!obj[USER_ID])
        if (USER_ID && obj[USER_ID]) {
            let sameFlowerNumber = this.getSameFlowerNumber(obj[USER_ID])
            let baoNumber = this.getBaoNumber(obj[USER_ID])
            //只有一个同花，并且没有豹子
            if (sameFlowerNumber == 1 && baoNumber == 0) {
                console.log('sameFlowerNumber,baoNumber')
                //过滤牌组，去掉所有其他用户已经发的牌
                let pokers = pokersConfig.filter(poker => {
                    let otherPokers = this.getOtherPokers(obj, USER_ID)
                    //poker是否在otherPokers中
                    let isIn = otherPokers.some(item => {
                        return item.points == poker.points
                    })
                    return !isIn
                })
                //清空原牌组
                obj[USER_ID] = []
                const randomPoker = () => {
                    //随机抽取一张牌
                    const index = Math.floor(Math.random() * pokers.length)
                    const poker = pokers[index]
                    obj[USER_ID].push(poker)
                    //删除这张牌，防止重复
                    pokers.splice(index, 1)
                }
                //重新发牌
                for (let i = 0; i < 9; i++) {
                    randomPoker()
                }
                obj[USER_ID] = obj[USER_ID].sort((a, b) => {
                    return a.points - b.points
                })

                let newSameFlowerNumber = this.getSameFlowerNumber(obj[USER_ID])
                let newBaoNumber = this.getBaoNumber(obj[USER_ID])
                //只有一个同花，并且没有豹子
                if (newSameFlowerNumber == 1 && newBaoNumber == 0) {
                    obj = await this.main(obj)
                }
            }
        }
        return obj
    },
    //同花数量
    getSameFlowerNumber(pokers) {
        //按照花色分组
        let pokerGroups = {}
        pokers.forEach(poker => {
            if (Array.isArray(pokerGroups[poker.type])) {
                pokerGroups[poker.type].push(poker)
            } else {
                pokerGroups[poker.type] = [poker]
            }
        })
        let singleNumber = 0
        Object.values(pokerGroups).forEach(group => {
            if (group.length >= 3) {
                singleNumber++
            }
        })
        return singleNumber
    },
    //获取三个头数量
    getBaoNumber(pokers) {
        //按照值分组
        let pokerGroups = {}
        pokers.forEach(poker => {
            if (Array.isArray(pokerGroups[poker.value])) {
                pokerGroups[poker.value].push(poker)
            } else {
                pokerGroups[poker.value] = [poker]
            }
        })
        let baoNumber = 0
        Object.values(pokerGroups).forEach(group => {
            if (group.length >= 3) {
                baoNumber++
            }
        })
        return baoNumber
    },
    //获取其他用户的牌数组
    getOtherPokers(obj, USER_ID) {
        let arr = []
        Object.keys(obj).forEach(userId => {
            if (userId != USER_ID) {
                arr = [...arr, ...obj[userId]]
            }
        })
        return arr
    }
}
