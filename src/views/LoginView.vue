<script setup lang="ts">
import LoginWithEmail from '@/components/LoginWithEmail.vue'
import LoginWithGithub from '@/components/LoginWithGithub.vue'
</script>

<template>
	<main class="main container">
		<h1 class="mb-6 text-2xl font-medium">Login</h1>

		<div class="grid gap-8">
			<div><LoginWithEmail /></div>
			<div><LoginWithGithub /></div>
		</div>
	</main>
</template>
