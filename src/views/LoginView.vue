<script setup lang="ts">
import LoginWithEmail from '@/components/LoginWithEmail.vue'
import LoginWithGithub from '@/components/LoginWithGithub.vue'
</script>

<template>
	<main class="main container">
		<h1>Login</h1>

		<LoginWithEmail />

		<LoginWithGithub />
	</main>
</template>
