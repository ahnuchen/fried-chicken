<template>
	<div class="mvi-pb-2">
		<m-navbar border @left-click="goBack" title="用户列表" fixed :style="{ background: $var.basic, color: '#fff' }" left-icon="angle-left" right-icon="refresh" @right-click="reset"></m-navbar>
		<div class="app-users">
			<div v-for="(item, index) in users" :key="index" class="app-user">
				<div @click="setSpecialUser(item.user_id)" class="app-user-id">
					<span>用户ID：{{ item.user_id }}</span>
					<m-icon class="mvi-ml-2" type="star" color="#f0f009" v-if="specialUser == item.user_id"></m-icon>
				</div>
				<div>用户账号：{{ item.user_name }}</div>
				<div>
					用户昵称：<span class="mvi-text-info mvi-text-bold">{{ item.user_nickname }}</span>
				</div>
				<div>最后登录时间：{{ $moment(item.user_login).format('YYYY-MM-DD HH:mm') }}</div>
				<div>注册时间：{{ $moment(item.user_register).format('YYYY-MM-DD HH:mm') }}</div>
				<div @click="getTotalScores(item.user_id, index)">
					<span class="mvi-mr-2 mvi-text-error">统计数据<m-icon class="mvi-ml-1" type="angle-double-right"></m-icon></span>
					<span>{{ item.totalScores }}</span>
				</div>
			</div>
		</div>
		<m-page class="mvi-mt-4 app-page" v-if="pageObject.pageCounts && pageObject.pageCounts > 0" :color="$var.light" @model-change="queryUserList" v-model="pageObject.pageCurrent" :total="pageObject.pageCounts"></m-page>
	</div>
</template>

<script>
export default {
	name: 'users',
	data() {
		return {
			users: [],
			pageObject: {
				pageCurrent: 1,
				pageSize: 10
			},
			specialUser: null
		}
	},
	mounted() {
		this.getSpecialUser()
		this.queryUserList()
	},
	computed: {
		$var() {
			return this.$store.getters.appVue.$var
		}
	},
	methods: {
		getTotalScores(user_id, index) {
			this.$ruax
				.create({
					url: this.$api.queryTotalScoresByUser,
					data: {
						user_id: user_id
					},
					beforeSend: () => {
						this.$util.showLoading('统计中...')
					},
					complete: () => {
						this.$hideToast()
					}
				})
				.then(res => {
					if (res.state == 200) {
						this.users[index].totalScores = res.data
					} else if (res.state != 401) {
						this.$util.msgbox(res.message)
					}
				})
				.catch(error => {
					this.$util.msgbox(error.message)
				})
		},
		setSpecialUser(user_id) {
			this.$ruax
				.create({
					url: this.$api.modifyDict,
					data: {
						dict_key: 'SPECIAL_USER',
						dict_value: user_id
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
						this.getSpecialUser()
					} else if (res.state != 401) {
						this.$util.msgbox(res.message)
					}
				})
				.catch(error => {
					this.$util.msgbox(error.message)
				})
		},
		getSpecialUser() {
			this.$ruax
				.post(this.$api.getDict, {
					dict_key: 'SPECIAL_USER'
				})
				.then(res => {
					if (res.state == 200) {
						this.specialUser = res.data.dict_value
					} else {
						this.$util.msgbox(res.message)
					}
				})
		},
		reset() {
			this.pageObject = {
				pageCurrent: 1,
				pageSize: 10
			}
			this.queryUserList()
		},
		goBack() {
			this.$router.replace({
				path: '/'
			})
		},
		queryUserList() {
			this.$ruax
				.create({
					url: this.$api.queryUserList,
					data: {
						pageCurrent: this.pageObject.pageCurrent,
						pageSize: this.pageObject.pageSize
					},
					beforeSend: () => {
						this.$util.showLoading('正在获取数据...')
					},
					complete: () => {
						this.$hideToast()
					}
				})
				.then(res => {
					if (res.state == 200) {
						this.users = res.data.users.map(item => {
							return { ...item, totalScores: '未获取' }
						})
						this.pageObject = res.data.pageObject
						this.$nextTick(() => {
							this.$dap.element.setScrollTop({
								el: '#app',
								number: 0
							})
						})
					} else if (res.state != 401) {
						this.$util.msgbox(res.message)
					}
				})
				.catch(error => {
					this.$util.msgbox(error.message)
				})
		}
	}
}
</script>

<style lang="less" scoped>
.app-users {
	padding-top: 1.08rem;
}

.app-page {
	background-color: var(--dark);
}

.app-user {
	display: block;
	width: 100%;
	background-color: var(--dark);
	color: #fff;
	margin-bottom: 0.4rem;
	padding-bottom: 0.1rem;

	&:last-child {
		margin-bottom: 0;
	}

	& > div {
		padding: 0.1rem 0.2rem;

		&:last-child {
			margin-bottom: 0;
		}
	}

	.app-user-id {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		font-size: 0.32rem;
		font-weight: bold;
		width: 100%;
		padding: 0.2rem;
		border-bottom: 1px solid var(--basic);
	}
}
</style>
