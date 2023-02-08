<template>
	<div class="app-main">
		<div class="mvi-text-center mvi-mb-4">
			<m-image width="2.4rem" height="2.4rem" fit="fill" src="/poker/applet/logo.png"></m-image>
		</div>
		<h3 class="app-title">LOGIN FOR PLAY</h3>
		<div class="mvi-px-2">
			<m-input @keyup.enter="login" class="app-input" clearable border size="large" v-model.trim="form.user_name" placeholder="输入账号" left-icon="user"></m-input>
			<m-input @keyup.enter="login" class="app-input" clearable size="large" v-model.trim="form.user_password" type="password" placeholder="输入密码" left-icon="lock"></m-input>
		</div>
		<div class="mvi-pt-8 mvi-px-2 mvi-mb-10">
			<m-button @keyup.enter="login" @click="login" form-control size="large" :color="$store.getters.theme.data.darker">登录</m-button>
		</div>
		<div @click="goRegister" class="app-register">
			<span class="mvi-mr-1">注册新账号</span>
			<m-icon type="angle-double-right"></m-icon>
		</div>
	</div>
</template>
<script>
export default {
	name: 'login',
	data() {
		return {
			form: {
				user_name: '',
				user_password: ''
			}
		}
	},
	created() {
		this.form.user_name = localStorage.getItem('pokers-username') || ''
		this.form.user_password = localStorage.getItem('pokers-password') || ''
	},
	methods: {
		login() {
			setTimeout(() => {
				if (!this.form.user_name) {
					this.$util.msgbox('请输入账号')
					return
				}
				if (!this.form.user_password) {
					this.$util.msgbox('请输入密码')
					return
				}
				this.$ruax
					.create({
						url: this.$api.login,
						data: this.form,
						beforeSend: () => {
							this.$util.showLoading('正在登录...')
						},
						complete: () => {
							this.$hideToast()
						}
					})
					.then(res => {
						if (res.state == 200) {
							const token = res.data.token
							const userInfo = res.data.user
							this.$store.commit('userInfo', userInfo)
							this.$store.commit('token', token)
							//记住账号和密码
							localStorage.setItem('pokers-username', this.form.user_name)
							localStorage.setItem('pokers-password', this.form.user_password)
							this.$store.getters.appVue.setTheme()
							this.$router.replace({
								path: '/'
							})
						} else if (res.state != 401) {
							this.$util.msgbox(res.message)
						}
					})
			}, 200)
		},
		//跳转注册
		goRegister() {
			this.$router.replace({
				path: '/register'
			})
		}
	}
}
</script>
<style lang="less" scoped>
.app-main {
	display: block;
	width: 100%;
	min-height: 100%;
	padding-top: 2rem;

	.app-title {
		color: #ddd;
		text-align: center;
		margin-bottom: 0.8rem;
	}
	.app-input {
		background-color: var(--dark);
		color: #ebedf0;

		&:first-child {
			border-radius: 0.12rem 0.12rem 0 0;
		}

		&:last-child {
			border-radius: 0 0 0.12rem 0.12rem;
		}
	}

	.app-register {
		text-align: center;
		font-size: 0.32rem;
		color: var(--light);
	}
}
</style>
