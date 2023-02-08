<template>
	<div v-on="listeners" class="app-poker">
		<div v-if="active" class="app-poker-active"></div>
		<div class="app-poker-bg" :style="style"></div>
	</div>
</template>

<script>
export default {
	name: 'poker',
	data() {
		return {
			active: false
		}
	},
	props: {
		//数值
		value: {
			type: String,
			default: 'A',
			validator(value) {
				return ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'].includes(value)
			}
		},
		//0表示红桃，1表示黑桃，2表示方块，3表示花
		type: {
			type: Number,
			default: 0
		},
		//是否背面
		cover: {
			type: Boolean,
			default: false
		}
	},
	computed: {
		listeners() {
			return Object.assign({}, this.$listeners)
		},
		style() {
			let left = ''
			let top = ''
			if (this.cover) {
				top = '-6.4rem'
				left = '-2.6rem'
			} else if (this.type == 0) {
				top = '-4.82rem'
				if (this.value == 'A') {
					left = '-0.04rem'
				} else if (this.value == '2') {
					left = '-1.32rem'
				} else if (this.value == '3') {
					left = '-2.6rem'
				} else if (this.value == '4') {
					left = '-3.9rem'
				} else if (this.value == '5') {
					left = '-5.18rem'
				} else if (this.value == '6') {
					left = '-6.46rem'
				} else if (this.value == '7') {
					left = '-7.74rem'
				} else if (this.value == '8') {
					left = '-9.04rem'
				} else if (this.value == '9') {
					left = '-10.32rem'
				} else if (this.value == '10') {
					left = '-11.61rem'
				} else if (this.value == 'J') {
					left = '-12.88rem'
				} else if (this.value == 'Q') {
					left = '-14.2rem'
				} else if (this.value == 'K') {
					left = '-15.46rem'
				}
			} else if (this.type == 1) {
				top = '-3.22rem'
				if (this.value == 'A') {
					left = '-0.04rem'
				} else if (this.value == '2') {
					left = '-1.32rem'
				} else if (this.value == '3') {
					left = '-2.6rem'
				} else if (this.value == '4') {
					left = '-3.9rem'
				} else if (this.value == '5') {
					left = '-5.18rem'
				} else if (this.value == '6') {
					left = '-6.46rem'
				} else if (this.value == '7') {
					left = '-7.74rem'
				} else if (this.value == '8') {
					left = '-9.04rem'
				} else if (this.value == '9') {
					left = '-10.32rem'
				} else if (this.value == '10') {
					left = '-11.61rem'
				} else if (this.value == 'J') {
					left = '-12.88rem'
				} else if (this.value == 'Q') {
					left = '-14.2rem'
				} else if (this.value == 'K') {
					left = '-15.46rem'
				}
			} else if (this.type == 2) {
				top = '-1.62rem'
				if (this.value == 'A') {
					left = '-0.04rem'
				} else if (this.value == '2') {
					left = '-1.32rem'
				} else if (this.value == '3') {
					left = '-2.6rem'
				} else if (this.value == '4') {
					left = '-3.9rem'
				} else if (this.value == '5') {
					left = '-5.18rem'
				} else if (this.value == '6') {
					left = '-6.46rem'
				} else if (this.value == '7') {
					left = '-7.74rem'
				} else if (this.value == '8') {
					left = '-9.04rem'
				} else if (this.value == '9') {
					left = '-10.32rem'
				} else if (this.value == '10') {
					left = '-11.61rem'
				} else if (this.value == 'J') {
					left = '-12.88rem'
				} else if (this.value == 'Q') {
					left = '-14.2rem'
				} else if (this.value == 'K') {
					left = '-15.46rem'
				}
			} else {
				top = '-0.02rem'
				if (this.value == 'A') {
					left = '-0.04rem'
				} else if (this.value == '2') {
					left = '-1.32rem'
				} else if (this.value == '3') {
					left = '-2.6rem'
				} else if (this.value == '4') {
					left = '-3.9rem'
				} else if (this.value == '5') {
					left = '-5.18rem'
				} else if (this.value == '6') {
					left = '-6.46rem'
				} else if (this.value == '7') {
					left = '-7.74rem'
				} else if (this.value == '8') {
					left = '-9.04rem'
				} else if (this.value == '9') {
					left = '-10.32rem'
				} else if (this.value == '10') {
					left = '-11.61rem'
				} else if (this.value == 'J') {
					left = '-12.88rem'
				} else if (this.value == 'Q') {
					left = '-14.2rem'
				} else if (this.value == 'K') {
					left = '-15.46rem'
				}
			}
			return {
				left,
				top
			}
		}
	}
}
</script>

<style lang="less" scoped>
.app-poker {
	display: block;
	position: relative;
	width: 1.2rem;
	height: 1.54rem;
	overflow: hidden;
	border-radius: 0.06rem;
	border: 1px solid #ddd;
	transition: all 300ms;
	z-index: 10;
}

.app-poker-bg {
	display: block;
	position: absolute;
	z-index: 1;
	width: 16.7rem;
	height: 7.98rem;
	background: url(/poker/admin/poker.webp) no-repeat center;
	background-size: cover;
}

.app-poker-active {
	position: absolute;
	left: 0;
	top: 0;
	z-index: 2;
	width: 100%;
	height: 100%;
	background-color: rgba(0, 0, 0, 0.2);
}
</style>
