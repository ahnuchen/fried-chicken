/**
 * 需要判断token的请求都放在这里
 *
 */
const routes = ['/api/dict/getDict', '/api/dict/modifyDict', '/api/room/queryHistoryPage', '/api/room/queryRoom2', '/api/user/queryUserInfo2', '/api/user/queryUserList', '/api/room/queryTotalScoresByUser']

module.exports = url => {
	//也可以自己实现验证方法
	if (routes.includes(url)) {
		return true
	} else {
		return false
	}
}
