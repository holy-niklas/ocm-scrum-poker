<script setup lang="ts">
import { watch } from 'vue'
import { useRoute, useRouter, type LocationQueryValue } from 'vue-router'
import { supabase } from './supabase'
import { useStore } from '@/use/store'

const route = useRoute()
const router = useRouter()

const APP_NAME: string = import.meta.env.VITE_APP_NAME

const { state, isAuthenticated, setAuthState } = useStore()

const logout = async () => {
	try {
		const { error } = await supabase.auth.signOut()
		if (error) throw error
	} catch (error) {
		console.error(error)
	}
}

supabase.auth.onAuthStateChange((_, session) => {
	setAuthState(session)
})

watch(isAuthenticated, async isLoggedIn => {
	await router.isReady()

	if (isLoggedIn && route.name === 'login') {
		router.replace((route.query.redirectTo as LocationQueryValue) ?? '/')
		return
	}
})
</script>

<template>
	<header class="header shadow-md">
		<div class="container grid items-center gap-x-2" :class="route.params.id ? 'grid-cols-3' : 'grid-cols-[1fr_auto]'">
			<RouterLink class="site-link" to="/">
				<img :alt="APP_NAME" class="size-10 max-w-none" src="@/assets/logo.svg" width="40" height="40" />
				<span :class="{ '<sm:hidden': route.params.id }" aria-hidden="true">{{ APP_NAME }}</span>
			</RouterLink>

			<div v-if="route.params.id" class="text-center">
				<template v-if="state.room">Room {{ state.room.id }}</template>
			</div>

			<button v-if="isAuthenticated" type="button" class="justify-self-end" @click="logout">Logout</button>
			<RouterLink v-else class="justify-self-end" to="/login">Login</RouterLink>
		</div>
	</header>

	<RouterView />
</template>
