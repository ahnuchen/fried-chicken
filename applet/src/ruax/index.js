import Ruax from 'ruax'
import store from '../store'
import router from '../router'
import util from '../util'

let ruax = new Ruax()
//设置请求基本路径
ruax.defaults.baseUrl = process.env.VUE_APP_BASEURL
//设置请求方式
ruax.defaults.type = 'POST'
//设置超时时间30s
ruax.defaults.timeout = 30000
//请求发送给前统一处理数据
ruax.defaults.beforeRequest = config => {
    //请求头中设置token
    config.headers['authorization'] = store.getters.token
}

//请求响应拦截，统一处理需要登录的请求自动跳转登录页面
ruax.defaults.beforeResponse = (xhr, result) => {
    if (result) {
        if (result.state == 401) {
            util.alert(result.message, () => {
                store.commit('token', null)
                store.commit('userInfo', null)
                if (router.currentRoute.name == 'login') {
                    return
                }
                router.replace({
                    path: '/login'
                })
            })
        }
    }
}

export default ruax
