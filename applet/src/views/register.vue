<template>
	<div class="app-main">
		<div class="mvi-text-center mvi-mb-4">
			<m-image width="2.4rem" height="2.4rem" fit="fill" src="/poker/applet/logo.png"></m-image>
		</div>
		<h3 class="app-title">REGISTER FOR PLAY</h3>
		<div class="mvi-px-2">
			<m-input @keyup.enter="register" class="app-input" clearable border size="large" v-model.trim="form.user_nickname" placeholder="设置昵称，最多8个字符" left-icon="user"></m-input>
			<m-input @keyup.enter="register" class="app-input" clearable border size="large" v-model.trim="form.user_name" placeholder="设置账号，4-16个字母、数字和下划线" left-icon="user"></m-input>
			<m-input @keyup.enter="register" class="app-input" clearable size="large" border v-model.trim="form.user_password" type="password" placeholder="设置密码，不少于8位" left-icon="lock"></m-input>
			<m-input @keyup.enter="register" class="app-input" clearable size="large" v-model.trim="form.user_password2" type="password" placeholder="再次输入密码进行确认" left-icon="lock"></m-input>
		</div>
		<div class="mvi-pt-8 mvi-px-2 mvi-mb-10">
			<m-button @keyup.enter="register" @click="register" form-control size="large" :color="$store.getters.theme.data.darker">注册</m-button>
		</div>
		<div @click="goLogin" class="app-login">
			<m-icon type="angle-double-left"></m-icon>
			<span class="mvi-ml-1">返回登录</span>
		</div>
	</div>
</template>
<script>
export default {
	name: 'register',
	data() {
		return {
			form: {
				user_name: '',
				user_password: '',
				user_nickname: '',
				user_password2: ''
			}
		}
	},
	methods: {
		goLogin() {
			this.$router.replace({
				path: '/login'
			})
		},
		register() {
			setTimeout(() => {
				if (!this.form.user_nickname) {
					this.$util.msgbox('请设置昵称')
					return
				}
				if (!this.form.user_name) {
					this.$util.msgbox('请设置账号')
					return
				}
				if (!this.form.user_password) {
					this.$util.msgbox('请设置密码')
					return
				}
				if (this.form.user_nickname.length > 8) {
					this.$util.msgbox('昵称最多8个字符')
					return
				}
				if (!this.$dap.common.matchingText(this.form.user_name, 'userName')) {
					this.$util.msgbox('账号限制在4-16位，仅限字母数字或者下划线')
					return
				}
				if (this.form.user_password.length < 8) {
					this.$util.msgbox('密码不少于8个字符')
					return
				}
				if (!this.form.user_password2) {
					this.$util.msgbox('请再次确认密码')
					return
				}
				if (this.form.user_password != this.form.user_password2) {
					this.$util.msgbox('两次密码输入不一致')
					return
				}
				this.$ruax
					.create({
						url: this.$api.register,
						data: {
							user_name: this.form.user_name,
							user_password: this.form.user_password,
							user_nickname: this.form.user_nickname
						},
						beforeSend: () => {
							this.$util.showLoading('注册中...')
						},
						complete: () => {
							this.$hideToast()
						}
					})
					.then(res => {
						if (res.state == 200) {
							this.$util.showSuccess('注册成功', () => {
								this.goLogin()
							})
						} else if (res.state != 401) {
							this.$util.msgbox(res.message)
						}
					})
			}, 200)
		}
	}
}
</script>
<style lang="less" scoped>
.app-main {
	display: block;
	width: 100%;
	min-height: 100%;
	padding-top: 1.2rem;

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

	.app-login {
		text-align: center;
		font-size: 0.32rem;
		color: var(--light);
	}
}
</style>
