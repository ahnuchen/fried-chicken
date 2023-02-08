export default [
	{
		path: '/',
		name: 'index',
		component: () => import(/* webpackChunkName:"index" */ '../views/index'),
		meta: {
			title: '主页 - 扑克牌',
			auth: true
		}
	},
	{
		path: '/login',
		name: 'login',
		component: () => import(/* webpackChunkName:"login" */ '../views/login'),
		meta: {
			title: '登录 - 扑克牌'
		}
	},
	{
		path: '/register',
		name: 'register',
		component: () => import(/* webpackChunkName:"register" */ '../views/register'),
		meta: {
			title: '注册 - 扑克牌'
		}
	},
	{
		path: '/roomBJ/:id',
		name: 'roomBJ',
		component: () => import(/* webpackChunkName:"roomBJ" */ '../views/roomBJ'),
		meta: {
			title: '大家来比鸡 - 扑克牌',
			auth: true
		}
	},
	{
		path: '/roomZJ/:id',
		name: 'roomZJ',
		component: () => import(/* webpackChunkName:"roomZJ" */ '../views/roomZJ'),
		meta: {
			title: '大家来炸鸡 - 扑克牌',
			auth: true
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
	}
]
