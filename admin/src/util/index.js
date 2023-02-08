import store from '../store'
import $var from '../assets/variables'
import $dap from 'dap-util'
const { Phone } = $dap.platform.device()
export default {
	notify(message, callback) {
		store.getters.appVue.$showNotify({
			message: message,
			callback: callback,
			timeout: 2000,
			type: 'success'
		})
	},
	msgbox(message, callback) {
		store.getters.appVue.$msgbox({
			message: message,
			callback: callback,
			animation: 'scale'
		})
	},
	Msgbox(message, callback) {
		store.getters.appVue.$msgbox({
			message: message,
			callback: callback,
			animation: 'translate'
		})
	},
	alert(message, callback) {
		if (Phone) {
			store.getters.appVue.$alert({
				title: '提示',
				message: message,
				callback: callback,
				overlayColor: 'rgba(0, 0, 0, 0.6)',
				btnColor: $var.basic
			})
		} else {
			store.getters.appVue.$Alert({
				title: '提示',
				message: message,
				callback: callback,
				overlayColor: 'rgba(0, 0, 0, 0.6)',
				btns: {
					ok: {
						color: $var.dark, //自定义按钮颜色
						subColor: '#fff' //自定义按钮文字颜色
					}
				}
			})
		}
	},
	confirm(message, callback) {
		if (Phone) {
			store.getters.appVue.$confirm({
				title: '提示',
				message: message,
				callback: callback,
				overlayColor: 'rgba(0, 0, 0, 0.6)',
				btnColor: [$var.basic, $var.light]
			})
		} else {
			store.getters.appVue.$Confirm({
				title: '提示',
				message: message,
				callback: callback,
				overlayColor: 'rgba(0, 0, 0, 0.6)',
				btns: {
					ok: {
						color: $var.dark,
						subColor: '#fff'
					},
					cancel: {
						color: 'transparent',
						subColor: $var.dark
					}
				}
			})
		}
	},
	prompt(message, callback) {
		if (Phone) {
			store.getters.appVue.$prompt({
				title: '提示',
				message: message,
				callback: callback,
				overlayColor: 'rgba(0, 0, 0, 0.6)',
				btnColor: [$var.basic, $var.light],
				placeholder: '请输入...',
				autofocus: true,
				clearable: true,
				align: 'center'
			})
		} else {
			store.getters.appVue.$Prompt({
				title: '提示',
				message: message,
				callback: callback,
				overlayColor: 'rgba(0, 0, 0, 0.6)',
				placeholder: '请输入...',
				autofocus: true,
				clearable: true,
				align: 'center',
				btns: {
					ok: {
						color: $var.dark,
						subColor: '#fff'
					},
					cancel: {
						color: 'transparent',
						subColor: $var.dark
					}
				}
			})
		}
	},
	showLoading(message) {
		store.getters.appVue.$showToast({
			type: 'loading',
			message: message,
			background: 'rgba(0, 8, 9,.8)',
			color: '#c3e1e8',
			icon: {
				type: 'load-a',
				spin: true,
				color: '#5b757b'
			},
			overlayColor: 'rgba(0,0,0,.05)'
		})
	},
	showSuccess(message, callback) {
		store.getters.appVue.$showToast({
			type: 'success',
			message: message,
			timeout: 1000,
			callback: callback,
			background: 'rgba(0, 8, 9,.8)',
			color: '#c3e1e8',
			overlayColor: 'rgba(0,0,0,.05)'
		})
	},
	showError(message, callback) {
		store.getters.appVue.$showToast({
			type: 'error',
			message: message,
			timeout: 1000,
			callback: callback,
			background: 'rgba(0, 8, 9,.8)',
			color: '#c3e1e8',
			overlayColor: 'rgba(0,0,0,.05)',
			icon: 'error'
		})
	}
}
