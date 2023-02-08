<template>
	<div id="app">
		<keep-alive :include="$store.getters.cachePages">
			<router-view class="app-container" />
		</keep-alive>
	</div>
</template>
<script>
export default {
	name: 'app',
	created() {
		this.$store.commit('appVue', this)
		this.setTheme()
	},
	methods: {
		setTheme() {
			const theme = this.$store.getters.theme
			document.documentElement.style.setProperty('--basic', theme.data.basic)
			document.documentElement.style.setProperty('--dark', theme.data.dark)
			document.documentElement.style.setProperty('--darker', theme.data.darker)
			document.documentElement.style.setProperty('--light', theme.data.light)
			document.documentElement.style.setProperty('--modal', theme.data.modal)
		}
	}
}
</script>
<style lang="less">
body {
	background-color: var(--basic) !important;
}
#app {
	height: 100%;
	overflow-x: hidden;
	overflow-y: auto;
	background-color: var(--basic);
	color: #fff;
	position: relative;
}

.app-container {
	display: block;
	width: 100%;
	max-width: 7.5rem;
	margin: 0 auto;
}

::-webkit-scrollbar {
	width: 0.16rem;
	height: 0.16rem;
}

::-webkit-scrollbar-track {
	background: var(--basic);
	border-radius: 0.12rem;
}

::-webkit-scrollbar-thumb {
	background: var(--darker);
	border-radius: 0.12rem;
}
</style>
