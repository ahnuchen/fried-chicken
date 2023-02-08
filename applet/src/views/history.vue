<template>
	<div class="mvi-pb-2">
		<m-navbar border @left-click="goBack" title="历史记录" fixed :style="{ background: $store.getters.theme.data.basic, color: '#fff' }" left-icon="angle-left" right-icon="refresh" @right-click="reset"></m-navbar>
		<div class="app-rooms">
			<div @click="goRoomDetail(item)" v-for="(item, index) in rooms" :key="index" class="app-room">
				<div class="app-room-left">
					<div class="app-room-header mvi-mb-2">
						<span>房间号：{{ item.room_id }}</span>
						<span class="mvi-ml-2">【{{ item.room_type == 0 ? '比鸡' : '炸鸡' }}】</span>
					</div>
					<div class="app-room-content mvi-mb-1 mvi-ellipsis-1">房主：{{ item.user_nickname }}</div>
					<div class="app-room-content mvi-mb-1">
						<span>{{ item.room_mode }}局制</span>
						<span class="mvi-ml-4">{{ players(item).length }}人对局</span>
					</div>
					<div class="app-room-content mvi-font-small mvi-mb-1">开始时间：{{ $moment(item.room_begin).format('YYYY-MM-DD HH:mm') }}</div>
					<div class="app-room-content mvi-font-small">结束时间：{{ $moment(item.room_end).format('YYYY-MM-DD HH:mm') }}</div>
				</div>
				<div class="app-room-right">
					<m-icon type="angle-right"></m-icon>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	name: 'history',
	data() {
		return {
			rooms: []
		}
	},
	mounted() {
		this.queryHistory()
	},
	activated() {
		this.$dap.element.setScrollTop({
			el: '#app',
			number: this.$store.getters.scrollTop
		})
	},
	computed: {
		//玩家ID数组
		players() {
			return item => {
				return item.room_players.split('/').filter(item => {
					return item != ''
				})
			}
		}
	},
	methods: {
		reset() {
			this.$store.commit('scrollTop', 0)
			this.queryHistory()
		},
		goBack() {
			this.$store.commit('scrollTop', 0)
			this.$router.replace({
				path: '/'
			})
		},
		goRoomDetail(room) {
			const scrollTop = this.$dap.element.getScrollTop('#app')
			this.$store.commit('scrollTop', scrollTop)
			this.$router.replace({
				name: 'history-detail',
				params: {
					id: room.room_id
				}
			})
		},
		queryHistory() {
			this.$ruax
				.create({
					url: this.$api.queryHistory,
					beforeSend: () => {
						this.$util.showLoading('正在读取记录...')
					},
					complete: () => {
						this.$hideToast()
					}
				})
				.then(res => {
					if (res.state == 200) {
						this.rooms = res.data
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
.app-rooms {
	padding-top: 1.08rem;
}

.app-room {
	display: flex;
	justify-content: space-between;
	align-items: center;
	color: #ebedf0;
	width: 100%;
	padding: 0.2rem;
	background-color: var(--dark);
	margin-bottom: 0.2rem;

	.app-room-left {
		flex: 1;

		.app-room-header {
			font-size: 0.32rem;
			font-weight: 500;
		}

		.app-room-content {
			opacity: 0.6;
		}
	}

	.app-room-right {
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 0.4rem;
		opacity: 0.6;
	}

	&:last-child {
		margin-bottom: 0;
	}
}
</style>
