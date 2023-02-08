/**
 * 普通的工具类
 */
const util = {
    /**
     * 参数为空判断
     * @param {Object} params
     */
    hasUndefinedParam(params) {
        let err = false
        let length = params.length
        for (let i = 0; i < length; i++) {
            if (params[i] == null || params[i] == undefined) {
                err = true
                break
            }
        }
        return err
    },

    /**
     * 是否为4-16位的用户名(字母数字下划线)
     * @param {Object} text
     */
    isUserName(text) {
        return /^[a-zA-Z0-9_]{4,16}$/.test(text)
    }
}

module.exports = util
