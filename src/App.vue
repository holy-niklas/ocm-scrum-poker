<script setup lang="ts">
import { supabase } from './supabase'
import { useStore } from './use/store'

const { setAuthState } = useStore()

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
</script>

<template>
	<header>
		<img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="125" height="125" />

		<nav>
			<RouterLink to="/">Home</RouterLink>
			<!-- <RouterLink to="/about">About</RouterLink> -->
		</nav>
	</header>

	<RouterView />
</template>
