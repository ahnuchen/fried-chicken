import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)
import themes from '../assets/themes'

export default new Vuex.Store({
	state: {
		userInfo: null,
		appVue: null,
		token: null,
		defaultLogin: null,
		scrollTop: null,
		cachePages: ['history'],
		theme: null
	},
	getters: {
		userInfo(state) {
			if (state.userInfo) {
				return state.userInfo
			}
			let userInfo = localStorage.getItem('poker-userInfo')
			try {
				userInfo = JSON.parse(userInfo) || {}
			} catch (e) {
				userInfo = {}
			}
			return userInfo
		},
		token(state) {
			if (state.token) {
				return state.token
			}
			let token = localStorage.getItem('poker-token')
			return token || ''
		},
		appVue(state) {
			return state.appVue
		},
		defaultLogin(state) {
			if (typeof state.defaultLogin == 'boolean') {
				return state.defaultLogin
			}
			let defaultLogin = sessionStorage.getItem('poker-defaultLogin')
			return defaultLogin ? true : false
		},
		scrollTop(state) {
			return state.scrollTop
		},
		cachePages(state) {
			return state.cachePages.toString()
		},
		theme(state) {
			if (state.theme) {
				return state.theme
			}
			let theme = localStorage.getItem('poker-theme')
			try {
				theme = JSON.parse(theme) || null
			} catch (e) {
				theme = null
			}
			if (!theme) {
				theme = themes[0]
			}
			return theme
		}
	},
	mutations: {
		token(state, value) {
			if (value) {
				state.token = value
				localStorage.setItem('poker-token', value)
			} else {
				state.token = null
				localStorage.removeItem('poker-token')
			}
		},
		userInfo(state, value) {
			if (value) {
				state.userInfo = value
				localStorage.setItem('poker-userInfo', JSON.stringify(value))
			} else {
				state.userInfo = null
				localStorage.removeItem('poker-userInfo')
			}
		},
		appVue(state, value) {
			state.appVue = value
		},
		defaultLogin(state, value) {
			if (value) {
				state.defaultLogin = true
				sessionStorage.setItem('poker-defaultLogin', value)
			} else {
				state.defaultLogin = null
				sessionStorage.removeItem('poker-defaultLogin')
			}
		},
		scrollTop(state, value) {
			state.scrollTop = value
		},
		theme(state, value) {
			if (value) {
				state.theme = value
				localStorage.setItem('poker-theme', JSON.stringify(value))
			} else {
				state.theme = null
				localStorage.removeItem('poker-theme')
			}
		}
	}
})
