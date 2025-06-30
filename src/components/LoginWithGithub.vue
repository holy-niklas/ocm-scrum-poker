<script setup lang="ts">
import { supabase } from '@/supabase'

const signIn = async () => {
	try {
		const { /* data, */ error } = await supabase.auth.signInWithOAuth({ provider: 'github' })
		if (error) throw error
	} catch (error) {
		console.error(error)
	}
}
</script>

<template>
	<h2 class="mb-2 text-lg font-medium">mit GitHub</h2>

	<button @click="signIn">Login with GitHub</button>
</template>
