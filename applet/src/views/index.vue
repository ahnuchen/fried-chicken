<template>
	<div class="mvi-pt-10 mvi-px-4 app-main">
		<m-panel title="我的信息" title-class="app-panel-title" class="mvi-mb-8 app-panel">
			<m-cell class="app-cell" title-class="mvi-font-h6" :active="false" title="昵称">
				<div class="app-cell-content" @click="modify('user_nickname')" slot="content">
					<span class="app-cell-span">{{ userInfo.user_nickname }}</span>
					<m-icon class="mvi-ml-1" type="edit"></m-icon>
				</div>
			</m-cell>
			<m-cell class="app-cell" title-class="mvi-font-h6" :active="false" title="账号">
				<div class="app-cell-content" @click="modify('user_name')" slot="content">
					<span class="app-cell-span">{{ userInfo.user_name }}</span>
					<m-icon class="mvi-ml-1" type="edit"></m-icon>
				</div>
			</m-cell>
			<m-cell class="app-cell" title-class="mvi-font-h6" :active="false" title="密码">
				<div class="app-cell-content" @click="modify('user_password')" slot="content">
					<span class="app-cell-span">*******</span>
					<m-icon class="mvi-ml-1" type="edit"></m-icon>
				</div>
			</m-cell>
			<m-cell class="app-cell" title-class="mvi-font-h6" :active="false" title="注册时间" :content="$moment(userInfo.user_register).format('YYYY-MM-DD HH:mm')" content-class="app-cell-content"></m-cell>
			<m-cell class="app-cell" title-class="mvi-font-h6" content-class="app-cell-content" :active="false" title="登录时间" :content="$moment(userInfo.user_login).format('YYYY-MM-DD HH:mm')"></m-cell>
			<m-cell class="app-cell" title-class="mvi-font-h6" content-class="app-cell-content" :active="false" title="主题皮肤">
				<div class="app-cell-content" @click="themeShow = true" slot="content">
					<span class="app-cell-span">{{ $store.getters.theme.name }}</span>
					<m-icon class="mvi-ml-1" type="angle-right"></m-icon>
				</div>
			</m-cell>
		</m-panel>
		<div class="app-btns">
			<div class="mvi-pr-2">
				<m-button class="mvi-mb-4" size="large" :color="$store.getters.theme.data.dark" @click="roomShow = true" form-control> <m-icon type="home-alt" class="mvi-mr-1"></m-icon>创建房间 </m-button>
			</div>
			<div class="mvi-pl-2">
				<m-button class="mvi-mb-4" size="large" :color="$store.getters.theme.data.darker" form-control @click="joinRoom"> 加入房间<m-icon type="sign-in" class="mvi-ml-1"></m-icon> </m-button>
			</div>
		</div>
		<div class="app-btns">
			<div class="mvi-pr-2">
				<m-button size="large" form-control :color="$store.getters.theme.data.dark" @click="roomList"> <m-icon type="list" class="mvi-mr-1"></m-icon>历史记录 </m-button>
			</div>
			<div class="mvi-pl-2">
				<m-button size="large" form-control color="#ddd" :sub-color="$store.getters.theme.data.basic" plain @click="exitLogin"> 退出登录<m-icon type="logout" class="mvi-ml-1"></m-icon> </m-button>
			</div>
		</div>
		<!-- 修改信息弹窗 -->
		<m-modal closable show-times modal-color="#ebf2f3" :title="modifyInfo.title" v-model="modifyInfo.show">
			<m-input size="large" class="mvi-mt-6 mvi-mb-12" v-model.trim="form.user_nickname" v-if="modifyInfo.param == 'user_nickname'" placeholder="请输入新的昵称" clearable></m-input>
			<m-input class="mvi-mt-6 mvi-mb-12" v-model.trim="form.user_name" v-if="modifyInfo.param == 'user_name'" placeholder="请设置新账号" clearable></m-input>
			<m-input class="mvi-mt-6 mvi-mb-4" v-model.trim="form.user_password" v-if="modifyInfo.param == 'user_password'" type="password" placeholder="请设置新密码" clearable></m-input>
			<m-input class="mvi-mb-12" v-model.trim="form.user_password2" v-if="modifyInfo.param == 'user_password'" type="password" placeholder="请再次确认密码" clearable></m-input>
			<m-button form-control :color="$store.getters.theme.data.dark" size="large" @click="confirmModify">确定</m-button>
		</m-modal>
		<!-- 创建房间弹窗 -->
		<m-modal width="6.6rem" closable show-times modal-color="#ebf2f3" title="创建房间" v-model="roomShow">
			<m-form class="mvi-mt-2 mvi-mb-10" label-block block>
				<m-form-el label="模式：">
					<div class="mvi-flex-start">
						<m-radio :class="index == modeArray.length - 1 ? '' : 'mvi-mr-3'" :fill-color="$store.getters.theme.data.basic" :label="item.label" v-for="(item, index) in typeArray" :key="'mode-' + index" v-model="room.type" :value="item.value"></m-radio>
					</div>
				</m-form-el>
				<m-form-el label="对局数：">
					<div class="mvi-flex-between">
						<m-radio :fill-color="$store.getters.theme.data.basic" :label="item + '局'" v-for="(item, index) in modeArray" :key="'mode-' + index" v-model="room.mode" :value="item"></m-radio>
					</div>
				</m-form-el>
			</m-form>
			<m-button @click="createRoom" form-control :color="$store.getters.theme.data.dark">确认创建</m-button>
		</m-modal>
		<!-- 加入房间弹窗 -->
		<m-modal width="6.6rem" closable show-times modal-color="#ebf2f3" title="加入房间" v-model="attendShow">
			<m-input input-align="center" class="mvi-mt-6 mvi-mb-12" @click="keyboard = true" :value="attendRoomId" readonly placeholder="点我输入房间号" :right-icon="{ type: 'angle-right', color: $store.getters.theme.data.light }"></m-input>
		</m-modal>
		<!-- 房间号软键盘 -->
		<m-number-keyboard class="app-keyboard" overlay-color="transparent" closable calibration :z-index="1000" :show-decimal="false" v-model="attendRoomId" :show.sync="keyboard" @complete="keboardComplete" complete-class="app-keyboard-complete"></m-number-keyboard>
		<!-- 设置皮肤弹窗 -->
		<m-actionsheet closable size="large" title="设置主题皮肤" v-model="themeShow" :options="themeOptions" @select="selectTheme"> </m-actionsheet>
	</div>
</template>
<script>
import themes from '../assets/themes'
export default {
	name: 'index',
	data() {
		return {
			modifyInfo: {
				show: false,
				title: '',
				param: ''
			},
			form: {
				user_nickname: '',
				user_name: '',
				user_password: '',
				user_password2: ''
			},
			modeArray: [8, 12, 16, 20],
			typeArray: [
				{
					label: '比鸡',
					value: 0
				},
				{
					label: '炸鸡',
					value: 1
				}
			],
			roomShow: false,
			attendShow: false,
			attendRoomId: '',
			room: {
				mode: 8,
				type: 0
			},
			keyboard: false,
			themeShow: false
		}
	},
	computed: {
		userInfo() {
			return this.$store.getters.userInfo
		},
		themeOptions() {
			return themes.map(item => {
				return {
					label: item.name
				}
			})
		}
	},
	methods: {
		//设置主题皮肤
		selectTheme({ item, index }) {
			this.$store.commit('theme', themes[index])
			this.$store.getters.appVue.setTheme()
			this.$util.msgbox(`主题皮肤已经更换为<br>“${item.label}”`)
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
					this.$store.commit('userInfo', null)
					this.$router.replace({
						path: '/login'
					})
				}
			})
		},
		//加入房间
		joinRoom() {
			if (this.$platform.Phone) {
				this.attendShow = true
			} else {
				this.$util.prompt('在下方输入房间号', (r, val) => {
					if (r) {
						this.attendRoomId = val
						this.checkRoom()
					}
				})
			}
		},
		//键盘完成
		keboardComplete() {
			this.keyboard = false
			this.attendShow = false
			this.checkRoom()
		},
		//校验房间号
		checkRoom() {
			if (!this.attendRoomId) {
				this.$util.msgbox('房间号不能为空')
				return
			}
			this.$ruax
				.create({
					url: this.$api.checkRoom,
					data: {
						room_id: this.attendRoomId
					},
					beforeSend: () => {
						this.$util.showLoading('正在加入...')
					},
					complete: () => {
						this.$hideToast()
						this.attendRoomId = ''
					}
				})
				.then(res => {
					if (res.state == 200) {
						//比鸡
						if (res.data.room_type == 0) {
							this.$router.replace({
								name: 'roomBJ',
								params: {
									id: res.data.room_id
								}
							})
						}
						//炸鸡
						else if (res.data.room_type == 1) {
							this.$router.replace({
								name: 'roomZJ',
								params: {
									id: res.data.room_id
								}
							})
						}
					} else if (res.state != 401) {
						this.$util.msgbox(res.message)
					}
				})
		},
		//创建房间
		createRoom() {
			this.$ruax
				.create({
					url: this.$api.createRoom,
					data: {
						room_mode: this.room.mode,
						room_type: this.room.type
					},
					beforeSend: () => {
						this.$util.showLoading('正在创建...')
					},
					complete: () => {
						this.$hideToast()
					}
				})
				.then(res => {
					if (res.state == 200) {
						//比鸡
						if (res.data.room_type == 0) {
							this.$router.replace({
								name: 'roomBJ',
								params: {
									id: res.data.room_id
								}
							})
						}
						//炸鸡
						else if (res.data.room_type == 1) {
							this.$router.replace({
								name: 'roomZJ',
								params: {
									id: res.data.room_id
								}
							})
						}
					} else if (res.state != 401) {
						this.$util.msgbox(res.message)
					}
				})
		},
		//确认修改信息
		confirmModify() {
			let params = {
				user_id: this.userInfo.user_id
			}
			if (this.modifyInfo.param == 'user_nickname') {
				if (!this.form.user_nickname) {
					this.$util.msgbox('请设置新的昵称')
					return
				}
				if (this.form.user_nickname.length > 8) {
					this.$util.msgbox('昵称最多8个字符')
					return
				}
				params.user_nickname = this.form.user_nickname
			} else if (this.modifyInfo.param == 'user_name') {
				if (!this.form.user_name) {
					this.$util.msgbox('请设置新的账号')
					return
				}
				if (!this.$dap.common.matchingText(this.form.user_name, 'userName')) {
					this.$util.msgbox('账号限制在4-16位，仅限字母数字或者下划线')
					return
				}
				params.user_name = this.form.user_name
			} else if (this.modifyInfo.param == 'user_password') {
				if (!this.form.user_password) {
					this.$util.msgbox('请设置新密码')
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
				params.user_password = this.form.user_password
			}
			this.$ruax
				.create({
					url: this.$api.modifyUserInfo,
					data: params,
					beforeSend: () => {
						this.$util.showLoading('正在修改...')
					},
					complete: () => {
						this.$hideToast()
					}
				})
				.then(res => {
					if (res.state == 200) {
						this.$util.showSuccess('修改成功')
						this.modifyInfo.show = false
						this.$store.commit('userInfo', res.data)
					} else if (res.state != 401) {
						this.$util.msgbox(res.message)
					}
				})
		},
		//修改信息
		modify(param) {
			this.modifyInfo.param = param
			switch (param) {
				case 'user_nickname':
					this.modifyInfo.title = '修改昵称'
					this.form.user_nickname = this.userInfo.user_nickname
					break
				case 'user_name':
					this.modifyInfo.title = '修改账号'
					this.form.user_name = this.userInfo.user_name
					break
				case 'user_password':
					this.modifyInfo.title = '修改密码'
			}
			this.modifyInfo.show = true
		}
	}
}
</script>
<style lang="less" scoped>
.app-main {
	min-height: 100%;
}

.app-panel {
	background-color: var(--basic);
	color: #ebedf0;
	border-radius: 0.12rem;

	:deep(.app-panel-title) {
		color: #ebedf0;
		font-size: 0.36rem;
		text-align: center;
	}
}

.app-cell {
	background-color: var(--basic);
	color: #ebedf0;
	font-weight: 500;
	font-size: 0.32rem;

	:deep(.app-cell-content) {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		color: #ebedf0;
		white-space: nowrap;
		.app-cell-span {
			display: block;
			flex: 1;
			white-space: nowrap;
			text-overflow: ellipsis;
			overflow: hidden;
		}
	}
}

:deep(.mvi-number-keyboard-left) {
	width: calc(100% - 2.1rem);
}

.app-keyboard {
	color: var(--dark);

	:deep(.app-keyboard-complete) {
		background-color: var(--basic);
	}
}

.app-btns {
	display: flex;
	display: -webkit-flex;
	justify-content: space-between;
	align-items: center;
	width: 100%;
	margin-bottom: 0.4rem;

	& > div {
		display: block;
		width: 50%;
	}
}

.app-footer {
	display: flex;
	justify-content: flex-start;
	align-items: center;
	position: fixed;
	bottom: 0.2rem;
	right: 0.2rem;
	z-index: 400;
	font-size: 0.28rem;
	color: #fff;
}
</style>
