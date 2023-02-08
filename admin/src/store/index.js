import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
	state: {
		token: null,
		cachePages: ['history']
	},
	getters: {
		token(state) {
			if (state.token) {
				return state.token
			}
			let token = localStorage.getItem('poker-admin-token')
			return token || ''
		},
		appVue(state) {
			return state.appVue
		},
		cachePages(state) {
			return state.cachePages.toString()
		}
	},
	mutations: {
		token(state, value) {
			if (value) {
				state.token = value
				localStorage.setItem('poker-admin-token', value)
			} else {
				state.token = null
				localStorage.removeItem('poker-admin-token')
			}
		},
		appVue(state, value) {
			state.appVue = value
		}
	}
})
