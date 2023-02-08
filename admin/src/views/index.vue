<template>
	<div class="mvi-pt-10 mvi-px-4 app-main">
		<div class="mvi-mb-20">
			<m-cell border :active="false" class="app-cell" title="是否允许注册">
				<template #content>
					<m-switch @change="promiseRegisterChange" :active-color="$var.light" v-model="promiseRegister"></m-switch>
				</template>
			</m-cell>
			<m-cell border :active="false" @click="goUsers" class="app-cell" title="用户列表" :arrow="{ color: '#fff', type: 'angle-right' }"></m-cell>
			<m-cell border :active="false" @click="goHistory" class="app-cell" title="对局记录" :arrow="{ color: '#fff', type: 'angle-right' }"></m-cell>
		</div>
		<m-button size="large" form-control :color="$var.dark" @click="exitLogin"><m-icon type="logout" class="mvi-mr-1"></m-icon>退出登录</m-button>
	</div>
</template>
<script>
export default {
	name: 'index',
	data() {
		return {
			//是否允许注册
			promiseRegister: false
		}
	},
	computed: {
		$var() {
			return this.$store.getters.appVue.$var
		}
	},
	created() {
		this.getPromiseRegister()
	},
	methods: {
		goHistory() {
			this.$router.replace({
				name: 'history'
			})
		},
		goUsers() {
			this.$router.replace({
				name: 'users'
			})
		},
		//允许注册变更
		promiseRegisterChange() {
			if (this.promiseRegister) {
				this.$util.confirm('确定放开注册通道？', r => {
					if (r) {
						this.modifyPromiseRegister()
					} else {
						this.promiseRegister = false
					}
				})
			} else {
				this.$util.confirm('确定关闭注册通道', r => {
					if (r) {
						this.modifyPromiseRegister()
					} else {
						this.promiseRegister = true
					}
				})
			}
		},
		//修改字典
		modifyPromiseRegister() {
			this.$ruax
				.create({
					url: this.$api.modifyDict,
					data: {
						dict_key: 'PROMISE_REGISTER',
						dict_value: this.promiseRegister ? '0' : '1'
					},
					beforeSend: () => {
						this.$util.showLoading('执行中...')
					},
					complete: () => {
						this.$hideToast()
					}
				})
				.then(res => {
					if (res.state == 200) {
						this.getPromiseRegister()
					} else if (res.state != 401) {
						this.$util.msgbox(res.message)
					}
				})
				.catch(error => {
					this.$util.msgbox(error.message)
				})
		},
		//获取是否允许注册
		getPromiseRegister() {
			this.$ruax
				.post(this.$api.getDict, {
					dict_key: 'PROMISE_REGISTER'
				})
				.then(res => {
					if (res.state == 200) {
						const data = res.data.dict_value
						this.promiseRegister = data == '0'
					} else {
						this.$util.msgbox(res.message)
					}
				})
		},
		//跳转历史记录
		roomList() {
			this.$router.replace({
				path: '/history'
			})
		},
		//退出
		exitLogin() {
			this.$util.confirm('确定退出吗？', r => {
				if (r) {
					this.$store.commit('token', null)
					this.$router.replace({
						path: '/login'
					})
				}
			})
		}
	}
}
</script>
<style lang="less" scoped>
.app-main {
	min-height: 100%;
}

.app-cell {
	background-color: var(--basic);
	color: #fff;
}
</style>
