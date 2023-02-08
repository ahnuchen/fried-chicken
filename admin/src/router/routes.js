export default [
	{
		path: '/',
		name: 'index',
		component: () => import(/* webpackChunkName:"index" */ '../views/index'),
		meta: {
			title: '管理员主页 - 扑克牌',
			auth: true
		}
	},
	{
		path: '/login',
		name: 'login',
		component: () => import(/* webpackChunkName:"login" */ '../views/login'),
		meta: {
			title: '管理员登录 - 扑克牌'
		}
	},
	{
		path: '/history',
		name: 'history',
		component: () => import(/* webpackChunkName:"history" */ '../views/history'),
		meta: {
			title: '历史记录 - 扑克牌',
			auth: true
		}
	},
	{
		path: '/history/:id',
		name: 'history-detail',
		component: () => import(/* webpackChunkName:"history-detail" */ '../views/history-detail'),
		meta: {
			title: '历史记录 - 扑克牌',
			auth: true
		}
	},
	{
		path: '/users',
		name: 'users',
		component: () => import(/* webpackChunkName:"users" */ '../views/users'),
		meta: {
			title: '用户列表 - 扑克牌',
			auth: true
		}
	}
]
