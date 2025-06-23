<script setup lang="ts">
import { watch } from 'vue'
import { useRoute, useRouter, type LocationQueryValue } from 'vue-router'
import { supabase } from './supabase'
import { useStore } from '@/use/store'

const route = useRoute()
const router = useRouter()
const { isAuthenticated, setAuthState } = useStore()

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
	<header>
		<img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="125" height="125" />

		<nav class="flex flex-wrap gap-x-2">
			<RouterLink to="/">Home</RouterLink>
			<button v-if="isAuthenticated" type="button" @click="logout">Logout</button>
			<RouterLink v-else to="/login">Login</RouterLink>
		</nav>
	</header>

	<RouterView />
</template>
