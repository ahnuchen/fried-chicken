import Vue from 'vue'
import VueRouter from 'vue-router'
import routes from './routes'
import store from '../store'
import ruax from '../ruax'
import api from '../ruax/api'
import util from '../util'
//重写router的push方法
const originalPush = VueRouter.prototype.push
VueRouter.prototype.push = function push(location) {
    return originalPush.call(this, location).catch(err => err)
}
//重写replace方法
const originalReplace = VueRouter.prototype.replace
VueRouter.prototype.replace = function replace(location) {
    return originalReplace.call(this, location).catch(err => err)
}
Vue.use(VueRouter)

const router = new VueRouter({
    base: process.env.BASE_URL,
    routes: routes,
    mode: 'history',
    scrollBehavior(to, from, savedPostion) {
        return {
            x: 0,
            y: 0
        }
    },
    fallback: true
})

//路由跳转前拦截
router.beforeEach((to, from, next) => {
    if (to.meta.title) {
        document.title = to.meta.title
    }
    //需要验证权限状态
    if (to.meta && to.meta.auth) {
        if (store.getters.token) {
            next()
        } else {
            next({
                path: '/login',
                replace: true
            })
        }
    } else {
        next()
    }
})

//路由跳转后拦截
router.afterEach((to, from) => {
    //需要权限并且没有静默登录过
    if (to.meta.auth && !store.getters.defaultLogin) {
        ruax.create({
            url: api.defaultLogin,
            beforeSend: () => {
                util.showLoading('正在登录...')
            },
            complete: () => {
                store.getters.appVue.$hideToast()
            }
        }).then(res => {
            if (res.state == 200) {
                const token = res.data.token
                const userInfo = res.data.user
                store.commit('userInfo', userInfo)
                store.commit('token', token)
                store.commit('defaultLogin', 'defaultLogin')
            }
        })
    }
})

//错误
router.onError(error => {
    console.log(error)
    const pattern = /Loading chunk (\d)+ failed/g
    const isChunkLoadFailed = error.message.match(pattern)
    const targetPath = router.history.pending.fullPath
    if (isChunkLoadFailed) {
        router.replace(targetPath)
    }
})

export default router
