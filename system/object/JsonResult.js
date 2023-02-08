/**
 * 后台封装返回前端的类
 */
class JsonResult {
    constructor(state, message, data) {
        this.state = state
        this.message = message
        this.data = data
    }

    //成功返回封装
    static success(data) {
        return new JsonResult(JsonResult.STATUS_SUCCESS, 'ok', data)
    }
}

JsonResult.STATUS_SUCCESS = 200 //请求成功状态码
JsonResult.STATUS_SERVICE_ERROR = 301 //应用异常状态码
JsonResult.STATUS_TOKEN_ERROR = 401 //token异常状态码
JsonResult.STATUS_SYSTEM_ERROR = 501 //系统异常状态码

module.exports = JsonResult
