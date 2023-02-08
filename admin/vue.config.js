const path = require('path')
module.exports = {
	publicPath: '/poker/admin/',
	productionSourceMap: process.env.NODE_ENV === 'production' ? false : true,
	assetsDir: 'static',
	devServer: {
		host: '0.0.0.0',
		port: 8888, // 端口
		https: false,
		disableHostCheck: true,
		open: false
	},
	chainWebpack: config => {
		config.plugin('html').tap(args => {
			args[0].title = '扑克牌'
			return args
		})
	},
	configureWebpack: config => {
		config.resolve = {
			extensions: ['.js', '.vue', '.json', '.css'],
			alias: {
				vue$: 'vue/dist/vue.esm.js',
				'@': path.join(__dirname, 'src')
			}
		}
	}
}
