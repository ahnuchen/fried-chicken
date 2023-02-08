/**
 * token异常
 */
class UnauthorizedError extends Error {
    constructor(message) {
        super(message)
        this.message = message
        this.name = 'UnauthorizedError'
    }
}

module.exports = UnauthorizedError
