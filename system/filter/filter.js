/**
 * 需要判断token的请求都放在这里
 *
 */
const routes = ['/api/user/modify', '/api/room/create', '/api/room/check', '/api/user/defaultLogin', '/api/room/queryHistory', '/api/room/queryRoom', '/api/user/queryUserInfo']

module.exports = url => {
	//也可以自己实现验证方法
	if (routes.includes(url)) {
		return true
	} else {
		return false
	}
}
