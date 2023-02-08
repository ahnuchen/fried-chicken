/**
 * 分页对象
 */
class PageObject {
    constructor(pageCurrent, pageSize, rowCounts) {
        this.pageCurrent = pageCurrent
        this.pageSize = pageSize
        this.rowCounts = rowCounts
        this.pageCounts = this.getPageCounts()
    }

    getPageCounts() {
        return Math.ceil(this.rowCounts / this.pageSize)
    }
}

module.exports = PageObject
