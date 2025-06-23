<script setup lang="ts">
import { usePlayerStore } from '@/store/players'

const { vote } = usePlayerStore()

const storyPointList = ['?', '☕️', '1', '2', '3', '5', '8', '13', '20', '40', '100']
</script>

<template>
	<ul class="flex flex-wrap gap-4">
		<li v-for="(storyPoints, i) in storyPointList" :key="i">
			<button type="button" class="" @click="vote(storyPoints)">{{ storyPoints }}</button>
		</li>
	</ul>
</template>
