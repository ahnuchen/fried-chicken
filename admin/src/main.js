import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './remFit'
import ruax from './ruax'
import api from './ruax/api'
import mvi from 'mvi-web'
import util from './util'
import $dap from 'dap-util'
Vue.use(mvi)
Vue.prototype.$api = api
Vue.prototype.$ruax = ruax
Vue.prototype.$util = util
Vue.config.productionTip = false
import moment from 'moment'
Vue.prototype.$moment = moment

Vue.prototype.$platform = $dap.platform.device()

new Vue({
    router,
    store,
    render: h => h(App)
}).$mount('#app')
