<template>
	<div class="app-main">
		<!-- 解散房间或者退出房间 -->
		<m-button :disabled="currentGame > 0 && room && userInfo.user_id == room.room_creator" @click="dissolution" class="app-switch" round size="small">
			<m-icon type="switch"></m-icon>
		</m-button>
		<!-- 开始游戏 -->
		<div v-if="currentGame == 0 && room && room.room_creator == userInfo.user_id" class="app-room-start">
			<m-button @click="startGame" size="large" square class="mvi-text-bold" :color="$store.getters.theme.data.dark">开始游戏</m-button>
		</div>
		<!-- 房间信息 -->
		<div class="app-room-info">
			<div>房间号：{{ roomId }}</div>
			<div v-if="room" class="mvi-mt-2">对局数：{{ room.room_mode }}</div>
			<div class="mvi-mt-2">参与人数：{{ otherUsers.length + 1 }}</div>
			<div class="mvi-mt-2" v-if="currentGame == 0 && room && room.room_creator != userInfo.user_id">等待房主开始游戏...</div>
			<div v-if="currentGame" class="mvi-mt-2">当前第{{ currentGame }}局</div>
			<div v-if="currentGame" class="mvi-mt-2">当前跟盘分数：{{ followScore }}分</div>
			<div v-if="currentGame" class="mvi-mt-2">本局盘内总分：{{ innerScores }}分</div>
		</div>
		<!-- 自己 -->
		<div v-if="userInfo" class="app-first">
			<div class="app-pokers">
				<poker :cover="compare ? false : operations[userInfo.user_id] == 0" v-for="(item, index) in pokers[userInfo.user_id]" :key="index" :value="item.value" :type="item.type"></poker>
			</div>
			<div v-if="currentGame > 0 && operations[userInfo.user_id] != 2 && spokesman == userInfo.user_id" class="mvi-flex-between mvi-mb-2 mvi-px-4">
				<m-button @click="addScore(1)" type="success" size="small">x1</m-button>
				<m-button v-if="watchNumbers[userInfo.user_id] == 0 && followScore < 2" @click="addScore(2)" type="primary" size="small">x2</m-button>
				<m-button v-if="operations[userInfo.user_id] == 0" @click="lookPokers" type="info" size="small">看牌</m-button>
				<m-button v-if="unDiscardUsers.length == 2" @click="doCompare" type="warn" size="small">见面</m-button>
				<m-button v-if="unDiscardUsers.length > 1" @click="discardPokers" type="error" size="small">丢牌</m-button>
			</div>
			<div class="app-nickname">
				<m-overlay local :show="currentGame > 0 && !pokers[userInfo.user_id]">
					<div class="app-wait">等待加入</div>
				</m-overlay>
				<div class="mvi-flex-center">
					<span class="mvi-mr-2 app-count-down" v-if="timer && currentGame > 0 && spokesman == userInfo.user_id">{{ countDown }}s</span>
					<m-icon class="mvi-mr-2 mvi-text-warn" type="eye" v-if="currentGame > 0 && operations[userInfo.user_id] == 1"></m-icon>
					<m-icon class="mvi-mr-2 mvi-text-muted" type="eye-off" v-else-if="currentGame > 0 && operations[userInfo.user_id] == 0"></m-icon>
					<m-icon class="mvi-mr-2 mvi-text-muted" type="forbid-alt" v-else-if="currentGame > 0 && operations[userInfo.user_id] == 2"></m-icon>
					<span class="mvi-text-ellipsis">{{ userInfo.user_nickname }}</span>
					<span style="color: #ffeb00" v-if="$dap.number.isNumber(scores[userInfo.user_id])">【{{ scores[userInfo.user_id] }}】</span>
				</div>
			</div>
		</div>
		<!-- 第二个 -->
		<div v-if="otherUsers[0]" class="app-seconds">
			<div class="app-nickname">
				<m-overlay local :show="currentGame > 0 && !pokers[otherUsers[0].user_id]">
					<div class="app-wait">等待加入</div>
				</m-overlay>
				<div class="mvi-flex-center" :class="isOnline(otherUsers[0]) ? '' : 'app-offline'">
					<m-icon @click="watchOtherPoker(otherUsers[0])" class="mvi-mr-2 mvi-text-warn" type="eye" v-if="currentGame > 0 && operations[otherUsers[0].user_id] == 1"></m-icon>
					<m-icon class="mvi-mr-2 mvi-text-muted" type="eye-off" v-else-if="currentGame > 0 && operations[otherUsers[0].user_id] == 0"></m-icon>
					<m-icon class="mvi-mr-2 mvi-text-muted" type="forbid-alt" v-else-if="currentGame > 0 && operations[otherUsers[0].user_id] == 2"></m-icon>
					<span class="mvi-text-ellipsis">{{ otherUsers[0].user_nickname }}</span>
					<span v-if="$dap.number.isNumber(scores[otherUsers[0].user_id])">【{{ isOnline(otherUsers[0]) ? scores[otherUsers[0].user_id] : '已离线' }}】</span>
					<m-icon v-if="currentGame > 0" @click="throwBall(otherUsers[0])" size="0.4rem" class="mvi-ml-2" url="/poker/applet/ball.png" :style="ballStyle"></m-icon>
				</div>
			</div>
			<div class="app-pokers">
				<poker :cover="operations[otherUsers[0].user_id] == 2 ? true : !compare" v-for="(item, index) in pokers[otherUsers[0].user_id]" :key="index" :value="item.value" :type="item.type"></poker>
			</div>
			<m-icon v-if="currentGame > 0 && spokesman == otherUsers[0].user_id" class="app-hand" type="hand-up"></m-icon>
		</div>
		<!-- 第三个 -->
		<div v-if="otherUsers[1]" class="app-third" :style="{ left: currentGame > 0 && pokers[otherUsers[1].user_id] ? '-2.2rem' : '' }">
			<div class="app-pokers">
				<poker :cover="operations[otherUsers[1].user_id] == 2 ? true : !compare" v-for="(item, index) in pokers[otherUsers[1].user_id]" :key="index" :value="item.value" :type="item.type"></poker>
			</div>
			<div class="app-nickname">
				<m-overlay local :show="currentGame > 0 && !pokers[otherUsers[1].user_id]">
					<div class="app-wait">等待加入</div>
				</m-overlay>
				<div class="mvi-flex-center" :class="isOnline(otherUsers[1]) ? '' : 'app-offline'">
					<m-icon @click="watchOtherPoker(otherUsers[1])" class="mvi-mr-2 mvi-text-warn" type="eye" v-if="currentGame > 0 && operations[otherUsers[1].user_id] == 1"></m-icon>
					<m-icon class="mvi-mr-2 mvi-text-muted" type="eye-off" v-else-if="currentGame > 0 && operations[otherUsers[1].user_id] == 0"></m-icon>
					<m-icon class="mvi-mr-2 mvi-text-muted" type="forbid-alt" v-else-if="currentGame > 0 && operations[otherUsers[1].user_id] == 2"></m-icon>
					<span class="mvi-text-ellipsis">{{ otherUsers[1].user_nickname }}</span>
					<span v-if="$dap.number.isNumber(scores[otherUsers[1].user_id])">【{{ isOnline(otherUsers[1]) ? scores[otherUsers[1].user_id] : '已离线' }}】</span>
					<m-icon v-if="currentGame > 0" @click="throwBall(otherUsers[1])" size="0.4rem" class="mvi-ml-2" url="/poker/applet/ball.png" :style="ballStyle"></m-icon>
				</div>
			</div>
			<m-icon v-if="currentGame > 0 && spokesman == otherUsers[1].user_id" class="app-hand" type="hand-up"></m-icon>
		</div>
		<!-- 第四个 -->
		<div v-if="otherUsers[2]" class="app-fouth" :style="{ right: currentGame > 0 && pokers[otherUsers[2].user_id] ? '-2.2rem' : '' }">
			<div class="app-pokers">
				<poker :cover="operations[otherUsers[2].user_id] == 2 ? true : !compare" v-for="(item, index) in pokers[otherUsers[2].user_id]" :key="index" :value="item.value" :type="item.type"></poker>
			</div>
			<div class="app-nickname">
				<m-overlay local :show="currentGame > 0 && !pokers[otherUsers[2].user_id]">
					<div class="app-wait">等待加入</div>
				</m-overlay>
				<div class="mvi-flex-center" :class="isOnline(otherUsers[2]) ? '' : 'app-offline'">
					<m-icon @click="watchOtherPoker(otherUsers[2])" class="mvi-mr-2 mvi-text-warn" type="eye" v-if="currentGame > 0 && operations[otherUsers[2].user_id] == 1"></m-icon>
					<m-icon class="mvi-mr-2 mvi-text-muted" type="eye-off" v-else-if="currentGame > 0 && operations[otherUsers[2].user_id] == 0"></m-icon>
					<m-icon class="mvi-mr-2 mvi-text-muted" type="forbid-alt" v-else-if="currentGame > 0 && operations[otherUsers[2].user_id] == 2"></m-icon>
					<span class="mvi-text-ellipsis">{{ otherUsers[2].user_nickname }}</span>
					<span v-if="$dap.number.isNumber(scores[otherUsers[2].user_id])">【{{ isOnline(otherUsers[2]) ? scores[otherUsers[2].user_id] : '已离线' }}】</span>
					<m-icon v-if="currentGame > 0" @click="throwBall(otherUsers[2])" size="0.4rem" class="mvi-ml-2" url="/poker/applet/ball.png" :style="ballStyle"></m-icon>
				</div>
			</div>
			<m-icon v-if="currentGame > 0 && spokesman == otherUsers[2].user_id" class="app-hand" type="hand-up"></m-icon>
		</div>
		<!-- 快捷短语 -->
		<m-tooltip v-if="currentGame > 0" ref="pharses" :color="$store.getters.theme.data.dark" :border-color="$store.getters.theme.data.darker" text-color="#fff" class="app-pharses" :timeout="50" trigger="click" placement="top-end">
			<m-button size="mini" :color="$store.getters.theme.data.light">
				<span class="mvi-mx-2">
					<m-icon size="0.32rem" type="comment-o-alt"></m-icon>
				</span>
			</m-button>
			<template v-slot:title>
				<div class="app-pharses-wrapper">
					<div @click="sendPharses(item)" class="app-pharse" v-for="(item, index) in pharses" :key="index">{{ item }}</div>
				</div>
			</template>
		</m-tooltip>
		<!-- 本房间对局结束画面 -->
		<m-modal :z-index="600" animation="fade" width="5.4rem" overlay-color="rgba(0,0,0,.6)" :modal-color="$store.getters.theme.data.basic" color="#ddd" title="最终战绩" title-class="mvi-text-center" v-model="endShow">
			<div v-for="(item, key, index) in scores" :key="index" class="app-result">
				<div>{{ (showUser(key) || {}).user_nickname }}</div>
				<div>{{ item > 0 ? '+' : '' }}{{ item }}</div>
			</div>
			<div slot="footer" class="app-end-footer">
				<m-button :color="$store.getters.theme.data.dark" form-control @click="goBack">确认</m-button>
			</div>
		</m-modal>
		<!-- 查看他人牌组弹窗 -->
		<m-modal :show="!!targetPokers" :z-index="580" animation="fade" width="5.4rem" overlay-color="rgba(0,0,0,.6)" :modal-color="$store.getters.theme.data.basic" color="#ddd" :title="targetUser ? targetUser.user_nickname + '的牌' : '查看他人的牌'">
			<div class="mvi-flex-center mvi-py-4">
				<poker :class="index == 0 ? '' : 'mvi-ml-1'" v-for="(item, index) in targetPokers" :key="index" :value="item.value" :type="item.type"></poker>
			</div>
		</m-modal>
	</div>
</template>

<script>
import pharses from '@/assets/pharsesZJ'
import poker from '@/components/poker.vue'
export default {
	name: 'roomZJ',
	data() {
		return {
			//socket对象
			webSocket: null,
			//心跳检测计时器
			timer1: null,
			//socket地址
			wsUrl: process.env.VUE_APP_WS_ZJ,
			//房间信息
			room: null,
			//玩家用户数组
			users: [],
			//手牌集合
			pokers: {},
			//积分集合
			scores: {},
			//用户信息集合
			userInfos: [],
			//用户牌组操作记录
			operations: {},
			//用户闷牌上分次数记录
			stuffies: {},
			//用户明牌上分次数记录
			opens: {},
			//用户每次发言查看别人牌次数记录
			watchNumbers: {},
			//盘内总分
			innerScores: 0,
			//跟盘分数
			followScore: 1,
			//当前发言人
			spokesman: null,
			//当前局数，0表示还没有开始
			currentGame: 0,
			//是否开始比牌
			compare: false,
			//结果弹窗控制
			resultShow: false,
			//结束弹窗
			endShow: false,
			//快捷短语
			pharses: pharses,
			//每个用户的丢球次数
			throwCounts: {},
			//PC端鼠标按下标识
			mouseDownFlag: false,
			//发言计时器
			timer: null,
			//发言倒计时
			countDown: null,
			//查看他人的牌组
			targetPokers: null,
			//查看他人的信息
			targetUser: null
		}
	},
	components: {
		poker
	},
	computed: {
		//房间号
		roomId() {
			return this.$route.params.id
		},
		//用户信息
		userInfo() {
			return this.$store.getters.userInfo
		},
		//其他玩家
		otherUsers() {
			if (this.userInfos.length) {
				return this.userInfos.filter(item => {
					return item.user_id != this.userInfo.user_id
				})
			}
			return this.users.filter(item => {
				return item.user_id != this.userInfo.user_id
			})
		},
		//结果显示的用户
		showUser() {
			return user_id => {
				return this.userInfos.filter(user => {
					return user.user_id == user_id
				})[0]
			}
		},
		//是否在线
		isOnline() {
			return user => {
				return this.users.some(item => {
					return item.user_id == user.user_id
				})
			}
		},
		//未弃牌用户
		unDiscardUsers() {
			return Object.keys(this.pokers).filter(item => {
				return this.operations[item] == 0 || this.operations[item] == 1
			})
		},
		//用户旁边的球样式设置
		ballStyle() {
			return {
				opacity: this.throwCounts[this.userInfo.user_id] && this.throwCounts[this.userInfo.user_id] >= 20 ? '0.6' : ''
			}
		}
	},
	watch: {
		spokesman(newValue) {
			//存在发言人
			if (newValue) {
				//如果发言人是自己
				if (newValue == this.userInfo.user_id) {
					this.countDown = 30
					this.timer = setInterval(() => {
						console.log('countDown', this.countDown)
						if (this.countDown == 0) {
							if (this.timer) {
								clearInterval(this.timer)
								this.timer = null
							}
							this.autoDiscardPokers()
						}
						this.countDown -= 1
					}, 1000)
				}
				//发言人不是我自己
				else {
					if (this.timer) {
						clearInterval(this.timer)
						this.timer = null
						this.countDown = 0
					}
				}
			}
			//没有发言人了
			else {
				if (this.timer) {
					clearInterval(this.timer)
					this.timer = null
					this.countDown = 0
				}
			}
		}
	},
	mounted() {
		this.checkRoom()
		this.$dap.event.on(document.body, 'click.pharse', this.closePharses)
	},
	methods: {
		//自动丢弃牌
		autoDiscardPokers() {
			//没到你发言
			if (this.spokesman != this.userInfo.user_id) {
				return
			}
			//已经丢牌
			if (this.operations[this.userInfo.user_id] == 2) {
				return
			}
			//只剩下你没丢牌
			if (this.unDiscardUsers.length == 1) {
				return
			}
			this.$util.showLoading('请稍等...')
			this.send({
				type: 6,
				room: this.roomId,
				user: this.userInfo,
				content: '推送丢牌指令'
			})
		},
		//查看别人的牌
		watchOtherPoker(targetUser) {
			//没到你发言
			if (this.spokesman != this.userInfo.user_id) {
				return
			}
			//你还没看牌
			if (this.operations[this.userInfo.user_id] == 0) {
				this.$util.msgbox('你还没有看牌，无法查看他的牌')
				return
			}
			//你已经丢牌
			if (this.operations[this.userInfo.user_id] == 2) {
				this.$util.msgbox('你已经丢牌，无法查看他的牌')
				return
			}
			//人数少于2人
			if (this.unDiscardUsers.length <= 2) {
				this.$util.msgbox('场上人数不少于2人时才可以看牌')
				return
			}
			//一次看牌机会
			if (this.watchNumbers[this.userInfo.user_id] >= 1) {
				this.$util.msgbox('每人每次发言只有一次私人看牌机会噢')
				return
			}
			//是否有人还在闷牌
			const hasNoWatch = Object.keys(this.operations).some(key => {
				return this.operations[key] == 0
			})
			if (hasNoWatch) {
				this.$util.msgbox('只有场上所有人都看牌过才允许私下看牌')
				return
			}
			this.$util.showLoading('请稍等...')
			this.send({
				type: 13,
				room: this.roomId,
				user: this.userInfo,
				targetUser: targetUser,
				content: '查看别人牌'
			})
		},
		//见面
		doCompare() {
			//没到你发言
			if (this.spokesman != this.userInfo.user_id) {
				return
			}
			//已经丢牌
			if (this.operations[this.userInfo.user_id] == 2) {
				return
			}
			//仅剩一人
			if (this.unDiscardUsers.length == 1) {
				return
			}
			//超过两人在场
			if (this.unDiscardUsers.length > 2) {
				this.$util.msgbox('超过2人在场无法见面')
				return
			}

			this.$util.showLoading('请稍等...')
			this.send({
				type: 8,
				room: this.roomId,
				user: this.userInfo,
				content: '推送见面指令'
			})
		},
		//丢牌
		discardPokers() {
			//没到你发言
			if (this.spokesman != this.userInfo.user_id) {
				return
			}
			//已经丢牌
			if (this.operations[this.userInfo.user_id] == 2) {
				return
			}
			//只剩下你没丢牌
			if (this.unDiscardUsers.length == 1) {
				return
			}
			this.$util.confirm('确定要放弃手牌吗？', r => {
				if (r) {
					this.$util.showLoading('请稍等...')
					this.send({
						type: 6,
						room: this.roomId,
						user: this.userInfo,
						content: '推送丢牌指令'
					})
				}
			})
		},
		//看牌
		lookPokers() {
			//没到你发言
			if (this.spokesman != this.userInfo.user_id) {
				return
			}
			//已经看过牌或者丢牌了
			if (this.operations[this.userInfo.user_id] != 0) {
				return
			}
			this.$util.showLoading('请稍等...')
			this.send({
				type: 5,
				room: this.roomId,
				user: this.userInfo,
				content: '推送看牌指令'
			})
		},
		//上分
		addScore(num) {
			//没到你发言
			if (this.spokesman != this.userInfo.user_id) {
				return
			}
			//已经丢牌了
			if (this.operations[this.userInfo.user_id] == 2) {
				return
			}
			//仅剩一人无法上分
			if (this.unDiscardUsers.length == 1) {
				return
			}
			//上分大小限制
			if (this.followScore * num > 2) {
				this.$util.msgbox('最大跟盘分数为2分，不能再翻倍了')
				return
			}
			//不看牌上分次数限制
			if (this.operations[this.userInfo.user_id] == 0 && this.stuffies[this.userInfo.user_id] >= 5) {
				this.$util.msgbox('每人最多不看牌上分5次')
				return
			}
			this.$util.showLoading('请稍等...')
			this.send({
				type: 4,
				room: this.roomId,
				user: this.userInfo,
				num: num
			})
		},
		//刷新页面
		reload() {
			this.$router.go(0)
		},
		//球动画
		ballAnimation(ball, left, top) {
			setTimeout(() => {
				ball.style.left = left
				ball.style.top = top
				setTimeout(() => {
					ball.style.opacity = 0
					setTimeout(() => {
						ball.remove()
					}, 200)
				}, 400)
			}, 50)
		},
		//执行丢球动画
		doThrowBallAnimation(selfUser, targetUser) {
			//获取出球玩家序列
			const selfIndex = this.otherUsers.findIndex(item => {
				return item.user_id == selfUser.user_id
			})
			//生成一个球
			const ball = this.$dap.element.string2dom(`<div class="app-ball" data-index="${selfIndex}"></div>`)
			//加入页面
			this.$el.appendChild(ball)
			//获取目标玩家序列
			const targetIndex = this.otherUsers.findIndex(item => {
				return item.user_id == targetUser.user_id
			})
			let left = 0
			let top = 0
			//如果目标是第二个玩家
			if (targetIndex == 0) {
				left = 'calc(50% - 0.3rem)'
				top = '0.6rem'
			}
			//如果目标是第三个玩家
			else if (targetIndex == 1) {
				left = '0.6rem'
				top = 'calc(50% - 0.3rem)'
			}
			//如果目标是第四个玩家
			else if (targetIndex == 2) {
				left = 'calc(100% - 1.2rem)'
				top = 'calc(50% - 0.3rem)'
			}
			//如果目标是我自己
			else {
				left = 'calc(50% - 0.3rem)'
				top = 'calc(100% - 1.2rem)'
			}
			this.ballAnimation(ball, left, top)
		},
		//丢球
		throwBall(targetUser) {
			if (this.throwCounts[this.userInfo.user_id] && this.throwCounts[this.userInfo.user_id] >= 20) {
				return
			}
			this.send({
				type: 12,
				room: this.roomId,
				user: this.userInfo,
				content: '推送丢球指令',
				targetUser: targetUser
			})
		},
		//关闭消息弹窗
		closePharses(event) {
			if (!this.$refs.pharses || !this.$refs.pharses.$el) {
				return
			}
			if (this.$dap.element.isContains(this.$refs.pharses.$el, event.target)) {
				return
			}
			this.$refs.pharses.hideTooltip()
		},
		//发送快捷消息
		sendPharses(item) {
			if (!item) {
				return
			}
			this.send({
				type: 11,
				content: item,
				room: this.roomId,
				user: this.userInfo
			})
			this.$refs.pharses.hideTooltip()
		},
		//解散房间或者退出房间
		dissolution() {
			if (this.room && this.userInfo.user_id != this.room.room_creator) {
				this.$util.confirm('确定要退出房间吗？', r => {
					if (r) {
						this.goBack()
					}
				})
				return
			}
			if (this.room && this.currentGame > 0) {
				this.$util.msgbox('游戏对局中暂时无法解散房间')
				return
			}
			if (this.room) {
				this.$util.confirm('确定要解散该房间吗？', r => {
					if (r) {
						this.$util.showLoading('正在解散...')
						this.send({
							type: 10,
							room: this.roomId,
							user: this.userInfo,
							content: '解散房间'
						})
					}
				})
			}
		},
		//返回
		goBack() {
			if (this.webSocket) {
				this.webSocket.close()
				this.$hideToast()
				if (this.timer) {
					clearInterval(this.timer)
					this.timer = null
				}
				this.webSocket = null
			}
			this.$router.replace({
				path: '/'
			})
		},
		//开始游戏
		startGame() {
			if (this.users.length == 1) {
				this.$util.msgbox('只有你一个人不能开始游戏噢')
				return
			}
			this.$util.showLoading('请稍等...')
			this.send({
				type: 3,
				room: this.roomId,
				user: this.userInfo,
				content: '开始游戏'
			})
		},
		//校验房间
		checkRoom() {
			this.$ruax
				.create({
					url: this.$api.checkRoom,
					data: {
						room_id: this.roomId
					},
					beforeSend: () => {
						this.$util.showLoading('加载中...')
					},
					complete: () => {
						this.$hideToast()
					}
				})
				.then(res => {
					if (res.state == 200) {
						this.room = res.data
						//如果不是比鸡
						if (this.room.room_type != 1) {
							this.$util.msgbox('房间类型不符合', () => {
								this.goBack()
							})
							return
						}
						this.init()
					} else if (res.state != 401) {
						this.$util.msgbox(res.message, () => {
							this.goBack()
						})
					}
				})
		},
		//初始化
		init() {
			this.$util.showLoading('正在连接...')
			if ('WebSocket' in window) {
				this.webSocket = new WebSocket(this.wsUrl)
				this.webSocket.onerror = this.onError
				this.webSocket.onopen = this.onOpen
				this.webSocket.onmessage = this.onMessage
				this.webSocket.onclose = this.onClose
				window.onbeforeunload = this.onBeforeUnload
			} else {
				this.$hideToast()
				this.$util.alert('无法连接，你当前使用的浏览器不支持webSocket，请更换现代浏览器！')
			}
		},
		//监听窗口关闭
		onBeforeUnload() {
			if (this.webSocket) {
				this.webSocket.close()
			}
		},
		//连接发生错误的回调方法
		onError(code) {
			console.log('WebSocket连接发生错误', code)
			if (this.$route.name == 'roomZJ') {
				this.$util.alert('连接发生错误，点击下方确认按钮，尝试重新连接', () => {
					this.init()
				})
			}
		},
		//连接成功建立的回调方法
		onOpen() {
			console.log('webSocket连接成功')
			this.$hideToast()
			//向后台推送当前用户加入房间的消息
			this.send({
				type: 1,
				room: this.roomId,
				user: this.userInfo
			})
			//心跳检测
			if (this.timer1) {
				clearInterval(this.timer1)
				this.timer1 = null
			}
			this.timer1 = setInterval(() => {
				this.send({
					type: 0,
					room: this.roomId,
					user: this.userInfo,
					content: '心跳检测'
				})
			}, 30000)
		},
		//接收消息的回调方法
		onMessage(event) {
			//关闭loading
			this.$hideToast()
			//获取数据
			const data = JSON.parse(event.data)
			//异常处理
			if (data.type == -1) {
				console.log('异常回执', data)
				this.$util.msgbox(data.content, () => {
					if (data.data.needRefresh) {
						this.goBack()
					}
				})
			}
			//心跳检测
			else if (data.type == 0) {
				console.log('心跳检测回执', data)
			}
			//加入房间
			else if (data.type == 1) {
				console.log('加入房间通知', data)
				this.users = data.data.users
				this.currentGame = data.data.currentGame || 0
				this.scores = data.data.scores || {}
				this.userInfos = data.data.userInfos || []
				this.pokers = data.data.pokers || {}
				this.operations = data.data.operations || {}
				this.spokesman = data.data.spokesman
				this.innerScores = data.data.innerScores
				this.followScore = data.data.followScore
				this.stuffies = data.data.stuffies || {}
				this.opens = data.data.opens || {}
				this.watchNumbers = data.data.watchNumbers || {}
				this.throwCounts = data.data.throwCounts || {}
			}
			//离开房间
			else if (data.type == 2) {
				console.log('离开房间通知', data)
				if (data.data.userInfos) {
					this.users = data.data.users
					this.currentGame = data.data.currentGame || 0
					this.scores = data.data.scores || {}
					this.pokers = data.data.pokers || {}
					this.userInfos = data.data.userInfos || []
					this.operations = data.data.operations || {}
					this.followScore = data.data.followScore
					this.spokesman = data.data.spokesman
					this.innerScores = data.data.innerScores
					this.stuffies = data.data.stuffies || {}
					this.opens = data.data.opens || {}
					this.watchNumbers = data.data.watchNumbers || {}
				} else {
					this.users = data.data.users
				}
			}
			//游戏开始
			else if (data.type == 3) {
				console.log('游戏开始', data)
				this.users = data.data.users
				this.pokers = data.data.pokers || {}
				this.currentGame = data.data.currentGame || 0
				this.scores = data.data.scores || {}
				this.userInfos = data.data.userInfos || []
				this.operations = data.data.operations || {}
				this.spokesman = data.data.spokesman
				this.innerScores = data.data.innerScores
				this.followScore = data.data.followScore
				this.stuffies = data.data.stuffies || {}
				this.opens = data.data.opens || {}
				this.watchNumbers = data.data.watchNumbers || {}
				this.throwCounts = data.data.throwCounts || {}
			}
			//上分
			else if (data.type == 4) {
				console.log('上分完成', data)
				this.users = data.data.users
				this.pokers = data.data.pokers || {}
				this.currentGame = data.data.currentGame || 0
				this.scores = data.data.scores || {}
				this.userInfos = data.data.userInfos || []
				this.operations = data.data.operations || {}
				this.spokesman = data.data.spokesman
				this.innerScores = data.data.innerScores
				this.followScore = data.data.followScore
				this.stuffies = data.data.stuffies || {}
				this.opens = data.data.opens || {}
				this.watchNumbers = data.data.watchNumbers || {}
				this.$util.Msgbox(data.content)
			}
			//看牌完成
			else if (data.type == 5) {
				console.log('看牌完成', data)
				this.users = data.data.users
				this.pokers = data.data.pokers || {}
				this.currentGame = data.data.currentGame || 0
				this.scores = data.data.scores || {}
				this.userInfos = data.data.userInfos || []
				this.operations = data.data.operations || {}
				this.spokesman = data.data.spokesman
				this.innerScores = data.data.innerScores
				this.followScore = data.data.followScore
				this.stuffies = data.data.stuffies || {}
				this.opens = data.data.opens || {}
				this.watchNumbers = data.data.watchNumbers || {}
			}
			//丢牌完成
			else if (data.type == 6) {
				console.log('丢牌完成', data)
				this.users = data.data.users
				this.pokers = data.data.pokers || {}
				this.currentGame = data.data.currentGame || 0
				this.scores = data.data.scores || {}
				this.userInfos = data.data.userInfos || []
				this.operations = data.data.operations || {}
				this.spokesman = data.data.spokesman
				this.innerScores = data.data.innerScores
				this.followScore = data.data.followScore
				this.stuffies = data.data.stuffies || {}
				this.opens = data.data.opens || {}
				this.watchNumbers = data.data.watchNumbers || {}
				let content = '你已经丢牌'
				if (!data.data.isSelf) {
					content = data.content
				}
				this.$util.msgbox(content, () => {
					//获取没有丢牌的用户数组
					const unDiscardUsers = data.data.unDiscardUsers
					//只剩下一个用户没有丢牌了，则说明要进行下一局了
					if (unDiscardUsers.length == 1) {
						if (unDiscardUsers[0] == this.userInfo.user_id) {
							this.$util.msgbox('其余玩家全部丢牌，本局结束，由你赢下本局')
						} else {
							this.$util.msgbox(`场上仅剩“${this.getUserNickname(unDiscardUsers[0])}”没有丢牌，本局由他赢下`)
						}
					}
				})
			}
			//下一局
			else if (data.type == 7) {
				console.log('下一局开始', data)
				this.users = data.data.users
				this.pokers = data.data.pokers || {}
				this.currentGame = data.data.currentGame || 0
				this.scores = data.data.scores || {}
				this.userInfos = data.data.userInfos || []
				this.operations = data.data.operations || {}
				this.spokesman = data.data.spokesman
				this.innerScores = data.data.innerScores
				this.followScore = data.data.followScore
				this.stuffies = data.data.stuffies || {}
				this.opens = data.data.opens || {}
				this.watchNumbers = data.data.watchNumbers || {}
				this.throwCounts = data.data.throwCounts || {}
				this.$util.msgbox(`第${this.currentGame}局开始`)
				this.compare = false
			}
			//见面
			else if (data.type == 8) {
				console.log('见面', data)
				this.users = data.data.users
				this.pokers = data.data.pokers || {}
				this.currentGame = data.data.currentGame || 0
				this.scores = data.data.scores || {}
				this.userInfos = data.data.userInfos || []
				this.operations = data.data.operations || {}
				this.spokesman = data.data.spokesman
				this.innerScores = data.data.innerScores
				this.followScore = data.data.followScore
				this.stuffies = data.data.stuffies || {}
				this.opens = data.data.opens || {}
				this.watchNumbers = data.data.watchNumbers || {}
				this.compare = true
				this.$util.Msgbox(data.content)
			}
			//结束
			else if (data.type == 9) {
				console.log('本房间游戏结束', data)
				this.users = data.data.users
				this.scores = data.data.scores || {}
				this.endShow = true
			}
			//解散
			else if (data.type == 10) {
				console.log('房间解散', data)
				this.users = data.data.users
				this.$util.msgbox('房间已解散', () => {
					this.goBack()
				})
			}
			//接收快捷消息
			else if (data.type == 11) {
				console.log('接收消息', data)
				this.users = data.data.users
				this.$util.notify(`${data.data.belongUser.user_nickname}：${data.data.content}`)
			}
			//接收丢球通知
			else if (data.type == 12) {
				console.log('接收丢球通知', data)
				this.users = data.data.users
				this.throwCounts = data.data.throwCounts
				this.doThrowBallAnimation(data.data.selfUser, data.data.targetUser)
			}
			//接收私人看牌通知
			else if (data.type == 13) {
				console.log('接收私人看牌通知', data)
				this.users = data.data.users
				if (data.data.isSelf) {
					this.users = data.data.users
					this.pokers = data.data.pokers || {}
					this.currentGame = data.data.currentGame || 0
					this.scores = data.data.scores || {}
					this.userInfos = data.data.userInfos || []
					this.operations = data.data.operations || {}
					this.spokesman = data.data.spokesman
					this.innerScores = data.data.innerScores
					this.followScore = data.data.followScore
					this.stuffies = data.data.stuffies || {}
					this.opens = data.data.opens || {}
					this.watchNumbers = data.data.watchNumbers || {}
					this.targetPokers = data.data.targetPokers
					this.targetUser = data.data.targetUser
					//2s后自动关闭
					setTimeout(() => {
						this.targetPokers = null
						this.targetUser = null
					}, 2000)
				} else {
					this.$util.msgbox(data.content)
				}
			}
		},
		//连接关闭的回调方法
		onClose() {
			console.log('webscoket已经关闭')
		},
		//推送消息
		send(data) {
			if (!this.webSocket) {
				return
			}
			if (this.$dap.common.isObject(data)) {
				this.webSocket.send(JSON.stringify(data))
			}
		},
		//根据ID获取玩家昵称
		getUserNickname(user_id) {
			let user = this.userInfos.filter(item => {
				return item.user_id == user_id
			})[0]
			return user ? user.user_nickname : ''
		}
	},
	beforeDestroy() {
		this.$dap.event.off(document.body, 'click.pharse')
		if (this.timer) {
			clearInterval(this.timer)
			this.timer = null
			this.countDown = 0
		}
	}
}
</script>

<style lang="less" scoped>
.app-main {
	position: relative;
	height: 100%;
	user-select: none;
	-webkit-user-select: none;

	.app-room-start {
		position: absolute;
		z-index: 120;
		left: 50%;
		top: 50%;
		margin-top: -3rem;
		transform: translateX(-50%);
	}

	.app-room-info {
		position: absolute;
		z-index: 1;
		left: 50%;
		top: 50%;
		font-size: 0.48rem;
		color: #fff;
		transform: translate(-50%, -50%);
		opacity: 0.2;
		width: 6rem;
		text-align: center;
	}

	.app-switch {
		position: fixed;
		right: 0.1rem;
		top: 0.1rem;
		z-index: 200;
		opacity: 0.4;
	}
}
.app-first {
	display: block;
	position: absolute;
	bottom: 0.2rem;
	left: 50%;
	transform: translateX(-50%);
	padding: 0.2rem;
	z-index: 100;

	.app-pokers {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 6.8rem;
		margin-bottom: 0.3rem;
		padding-left: 0.5rem;
		position: relative;

		.app-poker {
			margin-left: -0.5rem;
		}
	}

	.app-nickname {
		display: block;
		text-align: center;
		font-weight: bold;
		font-size: 0.32rem;
		color: #fff;
		width: 4.8rem;
		margin: 0 auto;
		position: relative;
		overflow: hidden;
	}
}
.app-seconds {
	display: block;
	position: absolute;
	top: 0;
	left: 50%;
	transform: translateX(-50%);
	padding: 0.2rem;
	z-index: 10;

	.app-pokers {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 6.8rem;
		margin-top: 0.3rem;
		padding-left: 0.5rem;
		transform: scale(0.8) translateY(-0.4rem);
		position: relative;

		.app-poker {
			margin-left: -0.5rem;
		}
	}

	.app-nickname {
		display: block;
		text-align: center;
		font-weight: bold;
		font-size: 0.32rem;
		color: #fff;
		width: 4.8rem;
		margin: 0 auto;
		position: relative;
		overflow: hidden;
	}

	.app-hand {
		position: absolute;
		bottom: 0;
		left: 50%;
		font-size: 0.4rem;
		transform: translateX(-50%);
		animation: twinkle infinite 1000ms;
	}
}
.app-third {
	display: block;
	position: absolute;
	top: 50%;
	left: -3rem;
	transform: translateY(-50%) rotate(90deg);
	padding: 0.2rem;
	z-index: 20;
	margin-top: -1rem;

	.app-pokers {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 6.8rem;
		margin-bottom: 0.3rem;
		padding-left: 0.5rem;
		transform: scale(0.8) translateY(0.2rem);
		position: relative;

		.app-poker {
			margin-left: -0.5rem;
		}
	}

	.app-nickname {
		display: block;
		text-align: center;
		font-weight: bold;
		font-size: 0.32rem;
		color: #fff;
		width: 4.8rem;
		margin: 0 auto;
		position: relative;
		overflow: hidden;
	}

	.app-hand {
		position: absolute;
		top: -0.2rem;
		left: 50%;
		font-size: 0.4rem;
		transform: translateX(-50%) rotate(180deg);
		animation: twinkle infinite 1000ms;
	}
}
.app-fouth {
	display: block;
	position: absolute;
	top: 50%;
	right: -3rem;
	transform: translateY(-50%) rotate(-90deg);
	padding: 0.2rem;
	z-index: 15;
	margin-top: -1rem;

	.app-pokers {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 6.8rem;
		margin-bottom: 0.3rem;
		padding-left: 0.5rem;
		transform: scale(0.8) translateY(0.2rem);
		position: relative;

		.app-poker {
			margin-left: -0.5rem;
		}
	}

	.app-nickname {
		display: block;
		text-align: center;
		font-weight: bold;
		font-size: 0.32rem;
		color: #fff;
		width: 4.8rem;
		margin: 0 auto;
		position: relative;
		overflow: hidden;
	}

	.app-hand {
		position: absolute;
		top: -0.2rem;
		left: 50%;
		font-size: 0.4rem;
		transform: translateX(-50%) rotate(180deg);
		animation: twinkle infinite 1000ms;
	}
}
.app-wait {
	display: flex;
	justify-content: center;
	align-items: center;
	width: 100%;
	height: 100%;
	overflow: 0.1;
	font-weight: normal;
	font-size: 0.28rem;
	color: #ddd;
}
.app-result {
	display: block;
	width: 100%;
	margin-bottom: 0.2rem;
	padding: 0 0.6rem;
	font-size: 0.32rem;

	&:last-child {
		margin-bottom: 0;
	}

	& > div:first-child {
		display: inline-block;
		width: 75%;
		text-align: left;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
		vertical-align: middle;
	}

	& > div:last-child {
		display: inline-block;
		width: 25%;
		text-align: right;
		font-weight: bold;
	}
}
.app-end-footer {
	display: block;
	width: 100%;
}
.app-offline {
	opacity: 0.4;
}
.app-reload {
	position: fixed;
	left: 0.2rem;
	bottom: 0.2rem;
	z-index: 200;
}
.app-pharses {
	position: fixed;
	right: 0.2rem;
	bottom: 0.2rem;
	z-index: 200;

	.app-pharses-wrapper {
		height: 80vh;
		width: 100%;
		overflow-x: hidden;
		overflow-y: auto;
	}

	.app-pharse {
		display: block;
		width: 100%;
		font-size: 0.28rem;
		color: #fff;
		text-align: right;
		opacity: 0.8;
		padding: 0.2rem;
		user-select: none;

		&:active {
			opacity: 1;
			background-color: rgba(0, 0, 0, 0.1);
		}
	}
}

.mvi-button[disabled] {
	opacity: 0.3 !important;
}

:deep(.app-ball) {
	position: absolute;
	left: 0;
	top: 0;
	z-index: 480;
	width: 0.6rem;
	height: 0.6rem;
	border-radius: 50%;
	background: url(/poker/applet/ball.png) no-repeat center;
	background-size: cover;
	transition: top 400ms linear, left 400ms linear, opacity 200ms linear;
	-webkit-transition: top 400ms linear, left 400ms linear, opacity 200ms linear;

	&[data-index='-1'] {
		left: calc(50% - 0.3rem);
		top: calc(100% - 1.2rem);
	}

	&[data-index='0'] {
		left: calc(50% - 0.3rem);
		top: 0.6rem;
	}

	&[data-index='1'] {
		left: 0.6rem;
		top: calc(50% - 0.3rem);
	}

	&[data-index='2'] {
		left: calc(100% - 1.2rem);
		top: calc(50% - 0.3rem);
	}
}

@keyframes twinkle {
	from {
		opacity: 0;
	}

	to {
		opacity: 1;
	}
}

.app-count-down {
	color: #ff0000;
}
</style>
