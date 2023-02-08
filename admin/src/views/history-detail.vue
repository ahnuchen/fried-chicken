<template>
	<div v-if="room.room_id">
		<m-navbar border @left-click="goBack" title-class="mvi-font-h4 mvi-text-bold" :title="room.room_id ? room.room_id + '【' + (room.room_type == 0 ? '比鸡' : '炸鸡') + '】' : '对局详情'" fixed :style="{ background: $var.basic, color: '#fff' }" left-icon="angle-left"></m-navbar>
		<div class="app-main">
			<div class="mvi-flex-between mvi-mb-4 mvi-font-h6 mvi-px-10 mvi-text-bold">
				<div class="mvi-flex-start"><m-icon type="ul" class="mvi-mr-1"></m-icon>局数：{{ room.room_mode }}</div>
				<div class="mvi-flex-start"><m-icon type="user-group-alt" class="mvi-mr-1"></m-icon>人数：{{ players.length }}</div>
			</div>
			<div class="mvi-flex-between mvi-mb-8 mvi-px-8">
				<div class="mvi-text-center">
					<div class="mvi-flex-center mvi-mb-1"><m-icon type="calendar" class="mvi-mr-1"></m-icon>开始时间</div>
					<div>{{ $moment(room.room_begin).format('YYYY-MM-DD HH:mm') }}</div>
				</div>
				<div class="mvi-text-center">
					<div class="mvi-flex-center mvi-mb-1"><m-icon type="calendar" class="mvi-mr-1"></m-icon>结束时间</div>
					<div class="mvi-text-warn mvi-text-bold">{{ $moment(room.room_end).format('YYYY-MM-DD HH:mm') }}</div>
				</div>
			</div>
			<div class="mvi-mb-4 mvi-font-h5 mvi-text-center mvi-text-bold">最终得分</div>
			<div class="app-users mvi-mb-12">
				<div class="app-user" v-for="(item, index) in users" :key="index">
					<div :class="item.user_nickname ? '' : 'mvi-text-muted'">{{ item.user_nickname ? item.user_nickname : '用户已注销' }}</div>
					<div v-if="records.pokers[item.user_id]">{{ records.scores[item.user_id] > 0 ? '+' + records.scores[item.user_id] : records.scores[item.user_id] }}</div>
					<div style="opacity: 0.6" v-else>未参与对局</div>
				</div>
			</div>
			<!-- 存在所有对局记录 -->
			<template v-if="records.histories && records.histories.length">
				<div class="mvi-mb-4 mvi-font-h5 mvi-text-center mvi-text-bold">详细数据展示</div>
				<!-- 比鸡 -->
				<div v-if="room.room_type == 0">
					<div class="app-history" v-for="(item, index) in records.histories" :key="'history-' + index">
						<div class="mvi-text-center mvi-font-h6 mvi-mb-4">第{{ item.currentGame }}局</div>
						<div class="app-history-pokers" v-for="(item2, key, index2) in item.pokers" :key="index + '-' + index2">
							<div class="mvi-mb-2" :class="currentUser(key).user_nickname ? '' : 'mvi-text-muted'" v-if="currentUser(key)">{{ currentUser(key).user_nickname ? currentUser(key).user_nickname : '用户已注销' }}{{ key == item.discardsUser ? ' (弃牌)' : '' }}{{ passUser(key, item.passData) ? ' (通关)' : '' }}</div>
							<div v-if="key != item.discardsUser" class="mvi-mb-2">
								<div class="mvi-flex-center" v-for="(el, i) in [1, 2, 3]" :key="index + '-' + index2 + '-' + i" :style="{ marginTop: i == 0 ? '' : '-0.8rem' }">
									<template v-for="(e, ii) in [1, 2, 3]">
										<poker :style="{ marginLeft: ii == 0 ? '' : '-0.4rem' }" :type="singlePoker(i, ii, item2).type" :value="singlePoker(i, ii, item2).value" v-if="singlePoker(i, ii, item2)" :key="index + index2 + i + ii"></poker>
									</template>
								</div>
							</div>
							<div class="mvi-flex-center mvi-mb-2" v-else>
								<poker :style="{ marginLeft: i == 0 ? '' : '-0.6rem' }" v-for="(el, i) in item2" :key="index + i" :type="el.type" :value="el.value"></poker>
							</div>
							<div class="mvi-text-center mvi-text-info">本局结束时分数：{{ item.scores[key] }}分</div>
						</div>
					</div>
				</div>
				<!-- 炸鸡 -->
				<div v-else>
					<div class="app-history" v-for="(item, index) in records.histories" :key="'history-' + index">
						<div class="mvi-text-center mvi-font-h6 mvi-mb-4">第{{ item.currentGame }}局</div>
						<div class="mvi-flex-between mvi-text-info mvi-mb-4">
							<span>盘内总分：{{ item.innerScores }}分</span>
							<span>跟盘分数：{{ item.followScore }}分</span>
						</div>
						<div class="app-history-pokers" v-for="(item2, key, index2) in item.pokers" :key="index + '-' + index2">
							<div class="mvi-mb-2" :class="currentUser(key).user_nickname ? '' : 'mvi-text-muted'" v-if="currentUser(key)">{{ currentUser(key).user_nickname ? currentUser(key).user_nickname : '用户已注销' }}{{ zjPokersStatus(key, item.operations) }}</div>
							<div class="mvi-flex-center mvi-mb-2">
								<poker :style="{ marginLeft: i == 0 ? '' : '-0.5rem' }" v-for="(el, i) in item2" :key="index + i" :type="el.type" :value="el.value"></poker>
							</div>
							<div class="mvi-flex-between mvi-mb-2">
								<div v-if="item.stuffies">闷牌次数：{{ item.stuffies[key] }}</div>
								<div v-if="item.opens">明牌次数：{{ item.opens[key] }}</div>
								<div v-if="item.watchNumbers">私下看牌次数：{{ item.watchNumbers[key] }}</div>
							</div>
							<div class="mvi-text-center mvi-text-info">本局结束时分数：{{ item.scores[key] }}分</div>
						</div>
					</div>
				</div>
			</template>
			<!-- 只显示最后一局 -->
			<template v-else>
				<div class="mvi-mb-4 mvi-font-h6 mvi-text-center mvi-text-bold">最后一局的数据展示</div>
				<!-- 比鸡 -->
				<div v-if="room.room_type == 0">
					<div class="app-history">
						<div class="app-history-pokers" v-for="(item, key, index) in records.pokers" :key="index">
							<div class="mvi-mb-2" :class="currentUser(key).user_nickname ? '' : 'mvi-text-muted'" v-if="currentUser(key)">{{ currentUser(key).user_nickname ? currentUser(key).user_nickname : '用户已注销' }}{{ key == records.discardsUser ? ' (弃牌)' : '' }}{{ passUser(key, records.passData) ? ' (通关)' : '' }}</div>
							<div v-if="key != records.discardsUser">
								<div class="mvi-flex-center" v-for="(el, i) in [1, 2, 3]" :key="index + '-' + i" :style="{ marginTop: i == 0 ? '' : '-0.8rem' }">
									<template v-for="(e, ii) in [1, 2, 3]">
										<poker :style="{ marginLeft: ii == 0 ? '' : '-0.4rem' }" :type="singlePoker(i, ii, item).type" :value="singlePoker(i, ii, item).value" v-if="singlePoker(i, ii, item)" :key="index + i + ii"></poker>
									</template>
								</div>
							</div>
							<div class="mvi-flex-center" v-else>
								<poker :style="{ marginLeft: i == 0 ? '' : '-0.6rem' }" v-for="(el, i) in item" :key="index + i" :type="el.type" :value="el.value"></poker>
							</div>
						</div>
					</div>
				</div>
				<!-- 炸鸡 -->
				<div v-else>
					<div class="app-history">
						<div class="mvi-flex-between mvi-text-info mvi-mb-4">
							<span>盘内总分：{{ records.innerScores }}分</span>
							<span>跟盘分数：{{ records.followScore }}分</span>
						</div>
						<div class="app-history-pokers" v-for="(item, key, index) in records.pokers" :key="index">
							<div class="mvi-mb-2" :class="currentUser(key).user_nickname ? '' : 'mvi-text-muted'" v-if="currentUser(key)">{{ currentUser(key).user_nickname ? currentUser(key).user_nickname : '用户已注销' }}{{ zjPokersStatus(key, records.operations) }}</div>
							<div class="mvi-flex-center mvi-mb-2">
								<poker :style="{ marginLeft: i == 0 ? '' : '-0.5rem' }" v-for="(el, i) in item" :key="index + i" :type="el.type" :value="el.value"></poker>
							</div>
							<div class="mvi-flex-between">
								<div v-if="records.stuffies">闷牌次数：{{ records.stuffies[key] }}</div>
								<div v-if="records.opens">明牌次数：{{ records.opens[key] }}</div>
								<div v-if="records.watchNumbers">私下看牌次数：{{ records.watchNumbers[key] }}</div>
							</div>
						</div>
					</div>
				</div>
			</template>
		</div>
	</div>
</template>

<script>
import poker from '@/components/poker.vue'
export default {
	name: 'history-detail',
	data() {
		return {
			room: {},
			users: [],
			records: {}
		}
	},
	components: {
		poker
	},
	computed: {
		$var() {
			return this.$store.getters.appVue.$var
		},
		//玩家ID数组
		players() {
			if (this.room.room_players) {
				return this.room.room_players.split('/').filter(item => {
					return item != ''
				})
			}
			return []
		},
		//获取指定局通关的玩家
		passUser() {
			return (userId, passData) => {
				let user = null
				for (let key in passData) {
					if (passData[key] == 3) {
						user = this.users.find(item => {
							return item.user_id == key
						})
						break
					}
				}
				if (user) {
					return user.user_id == userId
				}
				return false
			}
		},
		//获取指定局弃牌的玩家
		discardsUser() {
			return discardsUser => {
				return this.users.find(item => {
					return item.user_id == discardsUser
				})
			}
		},
		//三道显示的纸牌
		singlePoker() {
			return (x, y, pokers) => {
				let arr = pokers.filter(item => {
					return item.belong[0] == x && item.belong[1] == y
				})
				return arr[0]
			}
		},
		//获取指定用户
		currentUser() {
			return userId => {
				let arr = this.users.filter(item => {
					return item.user_id == userId
				})
				return arr[0]
			}
		},
		//炸鸡每局用户牌组状态
		zjPokersStatus() {
			return (userId, operations) => {
				if (!operations) {
					return ''
				}
				if (operations[userId] == 2) {
					return '（弃牌）'
				}
				return ''
			}
		}
	},
	mounted() {
		this.getRoom()
	},
	methods: {
		//获取参与本房间的玩家
		getUsers() {
			let arr = []
			for (let user_id of this.players) {
				arr.push(this.getUser(user_id))
			}
			Promise.all(arr).then(res => {
				console.log(res)
				this.users = res
			})
		},
		//根据ID查询玩家
		getUser(user_id) {
			return new Promise((resolve, reject) => {
				let user = {}
				this.$ruax
					.create({
						url: this.$api.queryUserInfo,
						data: {
							user_id: user_id
						}
					})
					.then(res => {
						if (res.state == 200) {
							user = res.data
						} else {
							user.user_id = user_id
						}
						resolve(user)
					})
					.catch(err => {
						user.user_id = user_id
						resolve(user)
					})
			})
		},
		getRoom() {
			this.$ruax
				.create({
					url: this.$api.queryRoom,
					data: {
						room_id: this.$route.params.id
					},
					beforeSend: () => {
						this.$util.showLoading('正在加载...')
					},
					complete: () => {
						this.$hideToast()
					}
				})
				.then(res => {
					if (res.state == 200) {
						this.room = res.data
						this.getUsers()
						this.records = JSON.parse(this.room.room_records)
						console.log(this.records)
					} else if (res.state != 401) {
						this.$util.msgbox(res.message)
					}
				})
				.catch(error => {
					this.$util.msgbox(error.message)
				})
		},
		goBack() {
			this.$router.replace({
				path: '/history'
			})
		}
	}
}
</script>

<style scoped lang="less">
.app-main {
	padding: 1.08rem 0 0 0;
}

.app-users {
	display: block;
	width: 100%;

	.app-user {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		padding: 0.3rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.4);

		& > div:last-child {
			font-weight: bold;
		}
	}
}

.app-history {
	display: block;
	width: 100%;
	border-bottom: 1px solid #ebedf0;
	padding: 0.3rem;

	&:first-child {
		border-top: 1px solid #ebedf0;
	}

	&:last-child {
		border-bottom: none;
	}

	.app-history-pokers {
		margin-bottom: 0.4rem;
		background-color: var(--dark);
		padding: 0.2rem;
		border-radius: 0.12rem;

		&:last-of-type {
			margin-bottom: 0;
		}
	}
}
</style>
