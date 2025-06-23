<script setup lang="ts">
import { watch } from 'vue'
import { useRoute, useRouter, type LocationQueryValue } from 'vue-router'
import { supabase } from './supabase'
import { useRoomStore } from '@/store/rooms'

const route = useRoute()
const router = useRouter()
const { state, setAuthState } = useRoomStore()

const logout = async () => {
	try {
		const { error } = await supabase.auth.signOut()
		if (error) throw error
	} catch (error) {
		console.error(error)
	}
}

supabase.auth.onAuthStateChange((_, session) => {
	setAuthState(session !== null)
})

watch(
	() => state.isAuthenticated,
	async isLoggedIn => {
		await router.isReady()

		if (isLoggedIn && route.name === 'login') {
			router.replace((route.query.redirectTo as LocationQueryValue) ?? '/')
			return
		}
	},
)
</script>

<template>
	<header>
		<img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="125" height="125" />

		<nav class="flex flex-wrap gap-x-2">
			<RouterLink to="/">Home</RouterLink>
			<button v-if="state.isAuthenticated" type="button" @click="logout">Logout</button>
			<RouterLink v-else to="/login">Login</RouterLink>
		</nav>
	</header>

	<RouterView />
</template>
