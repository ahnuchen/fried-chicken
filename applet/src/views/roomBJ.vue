<template>
	<div class="app-main">
		<!-- 解散房间或者退出房间 -->
		<m-button v-if="!(currentGame > 0 && room && userInfo.user_id == room.room_creator)" @click="dissolution" class="app-switch" round size="small">
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
		</div>
		<!-- 自己 -->
		<div v-if="userInfo" class="app-first">
			<div class="app-pokers" @mousedown="pokerTouch(0, $event)" @touchstart="pokerTouch(0, $event)" @touchmove="pokerTouch(1, $event)" @touchend="pokerTouch(2, $event)">
				<poker ref="unGroupPokers" v-for="(item, index) in unGroupPokers(userInfo.user_id)" :key="index" :value="item.value" :type="item.type" :style="pokerStyle(item)"></poker>
			</div>
			<div v-if="currentGame > 0 && pokers[userInfo.user_id] && !isUnComplete(userInfo.user_id) && !showPlateDialog" class="app-prepare">
				<div v-for="(item, index) in [1, 2, 3]" :key="'group-' + index">
					<div v-for="(emp, i) in [1, 2, 3]" :key="'group-' + index + '-' + i">
						<poker v-if="singlePoker(index, i, userInfo.user_id)" :value="singlePoker(index, i, userInfo.user_id).value" :type="singlePoker(index, i, userInfo.user_id).type"></poker>
					</div>
				</div>
			</div>
			<div class="app-nickname">
				<m-overlay local :show="currentGame > 0 && !pokers[userInfo.user_id]">
					<div class="app-wait">等待加入</div>
				</m-overlay>
				<div class="mvi-flex-center">
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
				<m-overlay local :show="currentGame > 0 && pokers[otherUsers[0].user_id] && discardsUser == otherUsers[0].user_id">
					<div class="app-wait">已弃牌</div>
				</m-overlay>
				<div :class="['mvi-flex-center', isOnline(otherUsers[0]) ? '' : 'app-offline']">
					<span class="mvi-text-ellipsis">{{ otherUsers[0].user_nickname }}</span>
					<span v-if="$dap.number.isNumber(scores[otherUsers[0].user_id])">【{{ isOnline(otherUsers[0]) ? scores[otherUsers[0].user_id] : '已离线' }}】</span>
					<m-icon v-if="currentGame > 0" @click="throwBall(otherUsers[0])" size="0.4rem" class="mvi-ml-2" url="/poker/applet/ball.png" :style="ballStyle"></m-icon>
				</div>
			</div>
			<div class="app-pokers">
				<poker cover v-for="(item, index) in unGroupPokers(otherUsers[0].user_id)" :key="index" :value="item.value" :type="item.type"></poker>
			</div>
			<div v-if="currentGame > 0 && pokers[otherUsers[0].user_id] && !isUnComplete(otherUsers[0].user_id)" class="app-prepare">
				<div v-for="(item, index) in [1, 2, 3]" :key="'group-' + index">
					<div v-for="(emp, i) in [1, 2, 3]" :key="'group-' + index + '-' + i">
						<poker :cover="!compare" v-if="singlePoker(index, i, otherUsers[0].user_id)" :value="singlePoker(index, i, otherUsers[0].user_id).value" :type="singlePoker(index, i, otherUsers[0].user_id).type"></poker>
					</div>
				</div>
			</div>
		</div>
		<!-- 第三个 -->
		<div v-if="otherUsers[1]" class="app-third" :style="{ left: currentGame > 0 && pokers[otherUsers[1].user_id] ? (!isUnComplete(otherUsers[1].user_id) ? '-1rem' : '-2.2rem') : '' }">
			<div class="app-pokers">
				<poker cover v-for="(item, index) in unGroupPokers(otherUsers[1].user_id)" :key="index" :value="item.value" :type="item.type"></poker>
			</div>
			<div v-if="currentGame > 0 && pokers[otherUsers[1].user_id] && !isUnComplete(otherUsers[1].user_id)" class="app-prepare">
				<div v-for="(item, index) in [1, 2, 3]" :key="'group-' + index">
					<div v-for="(emp, i) in [1, 2, 3]" :key="'group-' + index + '-' + i">
						<poker :cover="!compare" v-if="singlePoker(index, i, otherUsers[1].user_id)" :value="singlePoker(index, i, otherUsers[1].user_id).value" :type="singlePoker(index, i, otherUsers[1].user_id).type"></poker>
					</div>
				</div>
			</div>
			<div class="app-nickname">
				<m-overlay local :show="currentGame > 0 && !pokers[otherUsers[1].user_id]">
					<div class="app-wait">等待加入</div>
				</m-overlay>
				<m-overlay local :show="currentGame > 0 && pokers[otherUsers[1].user_id] && discardsUser == otherUsers[1].user_id">
					<div class="app-wait">已弃牌</div>
				</m-overlay>
				<div :class="['mvi-flex-center', isOnline(otherUsers[1]) ? '' : 'app-offline']">
					<m-icon v-if="currentGame > 0" @click="throwBall(otherUsers[1])" size="0.4rem" class="mvi-mr-2" url="/poker/applet/ball.png" :style="ballStyle"></m-icon>
					<span class="mvi-text-ellipsis">{{ otherUsers[1].user_nickname }}</span>
					<span v-if="$dap.number.isNumber(scores[otherUsers[1].user_id])">【{{ isOnline(otherUsers[1]) ? scores[otherUsers[1].user_id] : '已离线' }}】</span>
				</div>
			</div>
		</div>
		<!-- 第四个 -->
		<div v-if="otherUsers[2]" class="app-fouth" :style="{ right: currentGame > 0 && pokers[otherUsers[2].user_id] ? (!isUnComplete(otherUsers[2].user_id) ? '-1rem' : '-2.2rem') : '' }">
			<div class="app-pokers">
				<poker cover v-for="(item, index) in unGroupPokers(otherUsers[2].user_id)" :key="index" :value="item.value" :type="item.type"></poker>
			</div>
			<div v-if="currentGame > 0 && pokers[otherUsers[2].user_id] && !isUnComplete(otherUsers[2].user_id)" class="app-prepare">
				<div v-for="(item, index) in [1, 2, 3]" :key="'group-' + index">
					<div v-for="(emp, i) in [1, 2, 3]" :key="'group-' + index + '-' + i">
						<poker :cover="!compare" v-if="singlePoker(index, i, otherUsers[2].user_id)" :value="singlePoker(index, i, otherUsers[2].user_id).value" :type="singlePoker(index, i, otherUsers[2].user_id).type"></poker>
					</div>
				</div>
			</div>
			<div class="app-nickname">
				<m-overlay local :show="currentGame > 0 && !pokers[otherUsers[2].user_id]">
					<div class="app-wait">等待加入</div>
				</m-overlay>
				<m-overlay local :show="currentGame > 0 && pokers[otherUsers[2].user_id] && discardsUser == otherUsers[2].user_id">
					<div class="app-wait">已弃牌</div>
				</m-overlay>
				<div :class="['mvi-flex-center', isOnline(otherUsers[2]) ? '' : 'app-offline']">
					<span class="mvi-text-ellipsis">{{ otherUsers[2].user_nickname }}</span>
					<span v-if="$dap.number.isNumber(scores[otherUsers[2].user_id])">【{{ isOnline(otherUsers[2]) ? scores[otherUsers[2].user_id] : '已离线' }}】</span>
					<m-icon v-if="currentGame > 0" @click="throwBall(otherUsers[2])" size="0.4rem" class="mvi-ml-2" url="/poker/applet/ball.png" :style="ballStyle"></m-icon>
				</div>
			</div>
		</div>
		<!-- 操作界面 -->
		<div v-if="showPlateDialog" class="app-groups">
			<div v-for="(item, index) in [1, 2, 3]" :key="'group-' + index" class="app-group">
				<div class="app-group-empty" @click="insertOrRemove(index, i)" v-for="(emp, i) in [1, 2, 3]" :key="'group-' + index + '-' + i">
					<poker v-if="singlePoker(index, i, userInfo.user_id)" :value="singlePoker(index, i, userInfo.user_id).value" :type="singlePoker(index, i, userInfo.user_id).type"></poker>
				</div>
				<div class="app-group-btn">
					<m-icon @click="moveUp(index)" :class="['mvi-mr-2', index == 0 ? 'disabled' : '']" type="arrow-up"></m-icon>
					<m-icon @click="moveDown(index)" :class="['mvi-mr-2', index == 2 ? 'disabled' : '']" type="arrow-down"></m-icon>
					<m-icon @click="removeAll(index)" type="times"></m-icon>
				</div>
			</div>
			<div class="app-group-btns mvi-mt-6">
				<div v-if="Object.keys(pokers).length > 2 && !discardsUser" class="mvi-mr-4">
					<m-button plain @click="giveUp" sub-color="transparent" :color="$store.getters.theme.data.light" form-control>弃牌</m-button>
				</div>
				<div style="display: flex;">
					<m-button @click="autoCompletePocker" :color="$store.getters.theme.data.darker" form-control>自动配牌</m-button>
					<m-button type="success" @click="doConfirmPokers" :color="$store.getters.theme.data.darker" form-control>确认</m-button>
				</div>
			</div>
		</div>
		<!-- 比试结果界面 -->
		<m-modal :z-index="500" animation="fade" width="5.4rem" overlay-color="rgba(0,0,0,.6)" :modal-color="$store.getters.theme.data.modal" color="#fff" v-model="resultShow" :title="'第' + (group + 1) + '组'" title-class="mvi-text-center mvi-font-h5" radius="0.4rem">
			<div v-for="(item, key, index) in tempScores" :key="index" class="app-result">
				<div>{{ (showUser(key) || {}).user_nickname }}</div>
				<div>{{ item > 0 ? '+' : '' }}{{ item }}</div>
			</div>
		</m-modal>
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
	</div>
</template>

<script>
import pharses from '@/assets/pharsesBJ'
import poker from '@/components/poker.vue'
export default {
	name: 'roomBJ',
	data() {
		return {
			//socket对象
			webSocket: null,
			//心跳检测计时器
			timer: null,
			//socket地址
			wsUrl: process.env.VUE_APP_WS_BJ,
			//房间信息
			room: null,
			//玩家用户数组
			users: [],
			//手牌集合
			pokers: {},
			//积分集合
			scores: {},
			//当前局数，0表示还没有开始
			currentGame: 0,
			//被选择的未分组纸牌
			selectedPokers: [],
			//是否开始比牌
			compare: false,
			//比试组数，0表示第一组，1表示第二组，2表示第三组
			group: 0,
			//每组暂记分数
			tempScores: {},
			//结果弹窗控制
			resultShow: false,
			//结束弹窗
			endShow: false,
			//用户信息集合
			userInfos: [],
			//开始触摸坐标记录
			touchPoints: [-1, -1],
			//快捷短语
			pharses: pharses,
			//每个用户丢球次数
			throwCounts: {},
			//是否显示配牌弹窗
			showPlateDialog: false,
			//弃牌用户
			discardsUser: null,
			//PC端鼠标按下标识
			mouseDownFlag: false
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
		//没有配的牌
		unGroupPokers() {
			return user_id => {
				if (this.pokers[user_id]) {
					return this.pokers[user_id].filter(item => {
						return item.belong[0] == -1 && item.belong[1] == -1
					})
				}
				return []
			}
		},
		//纸牌选择样式
		pokerStyle() {
			return item => {
				let style = {}
				const flag = this.selectedPokers.some(poker => {
					return item.type == poker.type && item.value == poker.value
				})
				if (flag) {
					style.transform = 'translateY(-0.3rem)'
				}
				return style
			}
		},
		//三道显示的纸牌
		singlePoker() {
			return (x, y, user_id) => {
				if (this.pokers[user_id]) {
					let arr = this.pokers[user_id].filter(item => {
						return item.belong[0] == x && item.belong[1] == y
					})
					return arr[0]
				}
				return null
			}
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
		//是否未完成配牌
		isUnComplete() {
			return user_id => {
				return this.pokers[user_id].some(item => {
					return item.belong[0] == -1
				})
			}
		},
		//用户旁边的球样式设置
		ballStyle() {
			return {
				opacity: this.throwCounts[this.userInfo.user_id] && this.throwCounts[this.userInfo.user_id] >= 20 ? '0.6' : ''
			}
		}
	},
	mounted() {
		this.checkRoom()
		this.$dap.event.on(document.body, 'click.pharse', this.closePharses)
		if (this.$platform.PC) {
			this.$dap.event.on(document.body, 'mousemove.poker', e => {
				this.pokerTouch(1, e)
			})
			this.$dap.event.on(document.body, 'mouseup.poker', e => {
				this.pokerTouch(2, e)
			})
		}
	},
	methods: {
		//弃牌
		giveUp() {
			//两个人的对局无法弃牌
			if (Object.keys(this.pokers).length == 2) {
				this.$util.msgbox('两个人对局无法弃牌')
				return
			}
			if (this.discardsUser) {
				this.$util.msgbox('已经有人弃牌了，你无法弃牌')
				return
			}
			this.$util.confirm('确定要弃牌吗?', r => {
				if (r) {
					this.$util.showLoading('请稍等...')
					this.send({
						type: 11,
						room: this.roomId,
						user: this.userInfo,
						content: '弃牌'
					})
				}
			})
		},
		//配牌弹窗显示控制
		controlPlateDialog() {
			//如果已经弃牌了，则关闭弹窗
			if (this.discardsUser == this.userInfo.user_id) {
				this.showPlateDialog = false
			}
			//游戏开始并且牌组存在并且未完成配牌
			else if (this.currentGame > 0 && this.pokers[this.userInfo.user_id] && this.isUnComplete(this.userInfo.user_id)) {
				this.showPlateDialog = true
			} else {
				this.showPlateDialog = false
			}
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
				top = 'calc(50% - 1.2rem)'
			}
			//如果目标是第四个玩家
			else if (targetIndex == 2) {
				left = 'calc(100% - 1.2rem)'
				top = 'calc(50% - 1.2rem)'
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
				type: 10,
				room: this.roomId,
				user: this.userInfo,
				content: '推送丢球指令',
				targetUser: targetUser
			})
		},
		//牌组下移
		moveDown(index) {
			//最后一组无法下移
			if (index == 2) {
				return
			}
			let nextIndex = index + 1
			for (let i = 0; i < 3; i++) {
				const poker = this.singlePoker(index, i, this.userInfo.user_id)
				const nextPoker = this.singlePoker(nextIndex, i, this.userInfo.user_id)
				if (poker) {
					const order = this.getIndex(poker)
					this.pokers[this.userInfo.user_id][order].belong = [nextIndex, i]
				}
				if (nextPoker) {
					const nextOrder = this.getIndex(nextPoker)
					this.pokers[this.userInfo.user_id][nextOrder].belong = [index, i]
				}
			}
		},
		//牌组上移
		moveUp(index) {
			//第一组无法上移
			if (index == 0) {
				return
			}
			let prevIndex = index - 1
			for (let i = 0; i < 3; i++) {
				const poker = this.singlePoker(index, i, this.userInfo.user_id)
				const prevPoker = this.singlePoker(prevIndex, i, this.userInfo.user_id)
				if (poker) {
					const order = this.getIndex(poker)
					this.pokers[this.userInfo.user_id][order].belong = [prevIndex, i]
				}
				if (prevPoker) {
					const prevOrder = this.getIndex(prevPoker)
					this.pokers[this.userInfo.user_id][prevOrder].belong = [index, i]
				}
			}
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
				type: 9,
				content: item,
				room: this.roomId,
				user: this.userInfo
			})
			this.$refs.pharses.hideTooltip()
		},
		//放入或者移出纸牌
		insertOrRemove(index, i) {
			//获取选择的牌的长度
			const selectedLength = this.selectedPokers.length
			//获取该组位置上是否有牌
			const tempPoker = this.pokers[this.userInfo.user_id].filter(item => {
				return item.belong[0] == index && item.belong[1] == i
			})[0]
			//选择了牌
			if (selectedLength > 0) {
				//选择的牌数量超过3
				if (selectedLength.length > 3) {
					if (selectedLength > 3) {
						this.$util.msgbox('一组最多只能放入3张牌噢')
						this.selectedPokers = []
						return
					}
				}
				//如果只有一个
				if (selectedLength == 1) {
					//获取这个被选择的牌的序列
					const order = this.pokers[this.userInfo.user_id].findIndex(item => {
						return item.type == this.selectedPokers[0].type && item.value == this.selectedPokers[0].value
					})
					//该位置有牌则清空该位置
					if (tempPoker) {
						//获取该位置的牌在数组的序列
						const tempIndex = this.pokers[this.userInfo.user_id].findIndex(item => {
							return item.type == tempPoker.type && item.value == tempPoker.value
						})
						this.pokers[this.userInfo.user_id][tempIndex].belong = [-1, -1]
					}
					//将牌放到该位置
					this.pokers[this.userInfo.user_id][order].belong = [index, i]
					this.selectedPokers = []
				}
				//如果有多个则批量放入
				else {
					//获取该组的牌
					let indexPokers = this.pokers[this.userInfo.user_id].filter(item => {
						return item.belong[0] == index
					})
					//如果选择的牌数量大于剩下的位置数量
					if (selectedLength > 3 - indexPokers.length) {
						this.$util.msgbox('你所选择的牌过多')
						this.selectedPokers = []
						return
					}
					//遍历被选择的牌
					this.selectedPokers.forEach(item => {
						//每次都要重新获取该组的牌
						indexPokers = this.pokers[this.userInfo.user_id].filter(item => {
							return item.belong[0] == index
						})
						//获取被选择的牌的序列
						const order = this.pokers[this.userInfo.user_id].findIndex(p => {
							return item.value == p.value && item.type == p.type
						})
						//遍历三个位置
						for (let k = 0; k < 3; k++) {
							//判断位置是否有牌
							const isTake = indexPokers.some(p => {
								return p.belong[1] == k
							})
							//如果该位置没有牌
							if (!isTake) {
								this.pokers[this.userInfo.user_id][order].belong = [index, k]
								break
							}
						}
					})
					this.selectedPokers = []
				}
			}
			//没有选择牌
			else {
				//有牌则移除
				if (tempPoker) {
					//获取该位置的牌在数组的序列
					const tempIndex = this.pokers[this.userInfo.user_id].findIndex(item => {
						return item.type == tempPoker.type && item.value == tempPoker.value
					})
					this.pokers[this.userInfo.user_id][tempIndex].belong = [-1, -1]
				}
			}
		},
		//触摸纸牌
		pokerTouch(type, event) {
			if (this.userInfo.user_id == this.discardsUser) {
				return
			}
			//按下
			if (type == 0) {
				const pageX = event.targetTouches ? event.targetTouches[0].pageX : event.pageX
				const pageY = event.targetTouches ? event.targetTouches[0].pageY : event.pageY
				this.touchPoints = [pageX, pageY]
				this.mouseDownFlag = true
			}
			//触摸移动
			else if (type == 1) {
				if (this.$platform.PC && !this.mouseDownFlag) {
					return
				}
				const pageX = event.targetTouches ? event.targetTouches[0].pageX : event.pageX
				let poker = this.getTouchPokers(pageX)
				if (poker) {
					if (this.$platform.Phone || this.mouseDownFlag) {
						poker.active = true
					}
				}
			}
			//松开
			else {
				if (this.$platform.PC && !this.mouseDownFlag) {
					return
				}
				const pageX = event.targetTouches ? event.changedTouches[0].pageX : event.pageX
				const pageY = event.targetTouches ? event.changedTouches[0].pageY : event.pageY
				this.mouseDownFlag = false
				//单击事件
				if (pageX - this.touchPoints[0] == 0 && pageY - this.touchPoints[1] == 0) {
					//如果该牌被选中则取消选中，如果没被选择那么就设置为选中
					let poker = this.getTouchPokers(this.touchPoints[0])
					if (poker) {
						const isSelected = this.selectedPokers.some(item => {
							return item.type == poker.type && item.value == poker.value
						})
						if (isSelected) {
							this.selectedPokers = this.selectedPokers.filter(item => {
								return item.type != poker.type || item.value != poker.value
							})
						} else {
							this.selectedPokers.push({
								type: poker.type,
								value: poker.value
							})
						}
						poker.active = false
					}
				}
				//触摸移动后松开
				else {
					this.$refs.unGroupPokers.forEach(poker => {
						if (poker.active) {
							const isSelected = this.selectedPokers.some(item => {
								return item.type == poker.type && item.value == poker.value
							})
							//选中的则取消
							if (isSelected) {
								this.selectedPokers = this.selectedPokers.filter(item => {
									return item.type != poker.type || item.value != poker.value
								})
							} else {
								this.selectedPokers.push({
									type: poker.type,
									value: poker.value
								})
							}
							poker.active = false
						}
					})
				}
			}
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
							type: 8,
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
		//将一道纸牌全部撤回
		removeAll(index) {
			for (let i = 0; i < 3; i++) {
				const poker = this.singlePoker(index, i, this.userInfo.user_id)
				if (poker) {
					const order = this.getIndex(poker)
					this.pokers[this.userInfo.user_id][order].belong = [-1, -1]
				}
			}
			this.selectedPokers = []
		},
    // 自动配牌
    autoCompletePocker(){

    },
		//确认配牌
		doConfirmPokers() {
			if (this.isUnComplete(this.userInfo.user_id)) {
				this.$util.msgbox('配牌还没有完成')
				return
			}
			this.$util.showLoading('请稍等...')
			this.send({
				type: 4,
				room: this.roomId,
				user: this.userInfo,
				content: '配牌完成',
				pokers: this.pokers
			})
		},
		//开始游戏
		startGame() {
			if (this.users.length == 1) {
				this.$util.msgbox('只有你一个人不能开始游戏噢')
				return
			}
			if (this.room.room_creator != this.userInfo.user_id) {
				this.$util.msgbox('非房主无法开始游戏')
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
						if (this.room.room_type != 0) {
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
			if (this.$route.name == 'roomBJ') {
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
			if (this.timer) {
				clearInterval(this.timer)
				this.timer = null
			}
			this.timer = setInterval(() => {
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
				this.discardsUser = data.data.discardsUser
				this.throwCounts = data.data.throwCounts || {}
				this.compare = data.data.compare
				const pokers = data.data.pokers || {}
				//如果是我自己加入房间的通知
				if (data.data.isSelf) {
					this.pokers = pokers
					//判断是否需要展示配牌弹窗
					this.controlPlateDialog()
				} else {
					this.pokers = this.updateOtherPokers(pokers)
				}
			}
			//离开房间
			else if (data.type == 2) {
				console.log('离开房间通知', data)
				if (data.data.userInfos) {
					this.users = data.data.users
					this.currentGame = data.data.currentGame || 0
					this.scores = data.data.scores || {}
					const pokers = data.data.pokers || {}
					this.pokers = this.updateOtherPokers(pokers)
					this.userInfos = data.data.userInfos || []
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
				this.discardsUser = data.data.discardsUser
				this.throwCounts = data.data.throwCounts || {}
				this.compare = data.data.compare
				//判断是否需要展示配牌弹窗
				this.controlPlateDialog()
			}
			//配牌完成
			else if (data.type == 4) {
				console.log('配牌完成', data)
				this.users = data.data.users
				this.currentGame = data.data.currentGame || 0
				this.scores = data.data.scores || {}
				const pokers = data.data.pokers || {}
				//如果是自己配牌完成了
				if (data.data.isSelf) {
					this.pokers = pokers
					//判断是否需要展示配牌弹窗
					this.controlPlateDialog()
				} else {
					this.pokers = this.updateOtherPokers(pokers)
				}
				this.compare = data.data.compare
				//如果全部配牌完成，后端会自动进行比牌
				if (this.compare) {
					this.$util.msgbox('所有人都已经配好，即将进行比牌')
				}
			}
			//比试
			else if (data.type == 5) {
				console.log('比试完成', data)
				this.users = data.data.users
				this.pokers = data.data.pokers || {}
				this.currentGame = data.data.currentGame || 0
				this.scores = data.data.scores || {}
				this.group = data.data.group || 0
				this.tempScores = data.data.tempScores || {}
				this.resultShow = true
				this.compare = data.data.compare
				this.$refs.pharses.hideTooltip()
			}
			//下一局
			else if (data.type == 6) {
				console.log('下一局开始', data)
				this.users = data.data.users
				this.pokers = data.data.pokers || {}
				this.currentGame = data.data.currentGame || 0
				this.scores = data.data.scores || {}
				this.discardsUser = data.data.discardsUser
				this.throwCounts = data.data.throwCounts || {}
				this.compare = data.data.compare
				this.resultShow = false
				this.$util.msgbox(`第${this.currentGame}局开始`)
				//判断是否需要展示配牌弹窗
				this.controlPlateDialog()
			}
			//结束
			else if (data.type == 7) {
				console.log('本房间游戏结束', data)
				this.users = data.data.users
				this.scores = data.data.scores || {}
				this.endShow = true
			}
			//解散
			else if (data.type == 8) {
				console.log('房间解散', data)
				this.users = data.data.users
				this.$util.msgbox('房间已解散', () => {
					this.goBack()
				})
			}
			//接收快捷消息
			else if (data.type == 9) {
				console.log('接收消息', data)
				this.users = data.data.users
				this.$util.notify(`${data.data.belongUser.user_nickname}：${data.data.content}`)
			}
			//接收丢球通知
			else if (data.type == 10) {
				console.log('接收丢球通知', data)
				this.users = data.data.users
				this.throwCounts = data.data.throwCounts
				this.doThrowBallAnimation(data.data.selfUser, data.data.targetUser)
			}
			//弃牌通知
			else if (data.type == 11) {
				console.log('接收弃牌通知', data)
				this.users = data.data.users
				this.discardsUser = data.data.discardsUser
				this.compare = data.data.compare
				if (data.data.isSelf) {
					this.pokers = data.data.pokers
					this.selectedPokers = []
					this.$util.msgbox('你已弃牌', () => {
						//如果全部配牌完成，后端会自动进行比牌
						if (this.compare) {
							this.$util.msgbox('所有人都已经配好，即将进行比牌')
						}
					})
					//判断是否需要展示配牌弹窗
					this.controlPlateDialog()
				} else {
					this.pokers = this.updateOtherPokers(data.data.pokers)
					this.$util.msgbox(data.content, () => {
						//如果全部配牌完成，后端会自动进行比牌
						if (this.compare) {
							this.$util.msgbox('所有人都已经配好，即将进行比牌')
						}
					})
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
		//纸牌在数组中的位置
		getIndex(poker) {
			if (this.pokers[this.userInfo.user_id]) {
				return this.pokers[this.userInfo.user_id].findIndex(item => {
					return item.value == poker.value && item.type == poker.type
				})
			}
			return -1
		},
		//更新其他人的pokers
		updateOtherPokers(pokers) {
			//我的pokers
			const myPokers = this.pokers[this.userInfo.user_id]
			let newPokers = {}
			newPokers[this.userInfo.user_id] = myPokers
			//更新其他人的pokers
			this.otherUsers.forEach(user => {
				if (pokers[user.user_id]) {
					newPokers[user.user_id] = pokers[user.user_id]
				}
			})
			return newPokers
		},
		//获取手指经过的pokers
		getTouchPokers(pageX) {
			let poker = null
			for (let pokerCmp of this.$refs.unGroupPokers) {
				const placement = this.$dap.element.getElementBounding(pokerCmp.$el)
				if (pageX > placement.left && pageX < placement.left + pokerCmp.$el.offsetWidth) {
					poker = pokerCmp
				}
			}
			return poker
		}
	},
	beforeDestroy() {
		this.$dap.event.off(document.body, 'click.pharse')
		if (this.$platform.PC) {
			this.$dap.event.off(document.body, 'mousemove.poker')
			this.$dap.event.off(document.body, 'mouseup.poker')
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
		justify-content: flex-start;
		align-items: center;
		width: 6.8rem;
		margin-bottom: 0.2rem;
		padding-left: 0.5rem;

		.app-poker {
			margin-left: -0.5rem;
		}
	}

	.app-prepare {
		transform: scale(0.9) translateY(0.3rem);
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
		justify-content: flex-start;
		align-items: center;
		width: 6.8rem;
		margin-top: 0.3rem;
		padding-left: 0.5rem;
		transform: scale(0.75) translateY(-0.4rem);

		.app-poker {
			margin-left: -0.5rem;
		}
	}

	.app-prepare {
		transform: scale(0.7) translateY(-1rem);
	}

	.app-nickname {
		display: block;
		text-align: center;
		font-weight: bold;
		font-size: 0.28rem;
		color: #fff;
		width: 4.8rem;
		margin: 0 auto;
		position: relative;
		overflow: hidden;
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
		justify-content: flex-start;
		align-items: center;
		width: 6.8rem;
		margin-bottom: 0.3rem;
		padding-left: 0.5rem;
		transform: scale(0.75) translateY(0.4rem);

		.app-poker {
			margin-left: -0.5rem;
		}
	}

	.app-prepare {
		transform: scale(0.7) translateY(0.8rem);
	}

	.app-nickname {
		display: block;
		text-align: center;
		font-weight: bold;
		font-size: 0.28rem;
		color: #fff;
		width: 4.8rem;
		margin: 0 auto;
		position: relative;
		overflow: hidden;
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
		justify-content: flex-start;
		align-items: center;
		width: 6.8rem;
		margin-bottom: 0.3rem;
		padding-left: 0.5rem;
		transform: scale(0.75) translateY(0.4rem);

		.app-poker {
			margin-left: -0.5rem;
		}
	}

	.app-prepare {
		transform: scale(0.7) translateY(0.8rem);
	}

	.app-nickname {
		display: block;
		text-align: center;
		font-weight: bold;
		font-size: 0.28rem;
		color: #fff;
		width: 4.8rem;
		margin: 0 auto;
		position: relative;
		overflow: hidden;
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
.app-groups {
	display: block;
	width: 6.6rem;
	background-color: var(--dark);
	border-radius: 0.12rem;
	padding: 0.4rem;
	box-shadow: 0.02rem 0.02rem rgba(0, 0, 0, 0.2);
	position: fixed;
	left: 50%;
	top: 50%;
	z-index: 180;
	transform: translate(-50%, -50%);

	.app-group {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		margin-bottom: 0.2rem;
		position: relative;
		padding-right: 1.8rem;

		&:last-of-type {
			margin-bottom: 0;
		}

		.app-group-empty {
			display: block;
			width: 1.2rem;
			height: 1.54rem;
			background-color: var(--basic);
			border-radius: 0.12rem;
			position: relative;

			.app-poker {
				position: absolute;
				left: 0;
				top: 0;
			}
		}

		.app-group-btn {
			position: absolute;
			right: -0.1rem;

			.mvi-icon {
				background-color: var(--darker);
				color: var(--light);
				padding: 0.1rem;
				border-radius: 999rem;
				font-size: 0.24rem;
				cursor: pointer;

				&.disabled {
					opacity: 0.3;
					cursor: not-allowed;
				}
			}
		}
	}

	.app-group-btns {
		display: flex;
		display: -webkit-flex;
		justify-content: space-between;
		align-items: center;

		& > div {
			flex: 1;
		}
	}
}
.app-prepare {
	display: block;
	width: 4rem;
	margin: 0 auto 0.2rem auto;

	& > div {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-bottom: -0.4rem;

		&:last-child {
			margin-bottom: 0;
		}
	}
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
		top: calc(50% - 1.2rem);
	}

	&[data-index='2'] {
		left: calc(100% - 1.2rem);
		top: calc(50% - 1.2rem);
	}
}
</style>
