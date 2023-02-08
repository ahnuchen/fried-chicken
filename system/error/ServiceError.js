/**
 * 自定义异常
 */
class ServiceError extends Error {
    constructor(message) {
        super(message)
        this.message = message
        this.name = 'ServiceError'
    }
}

module.exports = ServiceError
