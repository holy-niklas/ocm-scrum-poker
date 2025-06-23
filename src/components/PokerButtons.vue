<script setup lang="ts">
const emit = defineEmits<{
	vote: [storyPoints: string]
}>()

const storyPointList = ['?', '☕️', '1', '2', '3', '5', '8', '13', '20', '40', '100']
</script>

<template>
	<ul class="flex flex-wrap gap-4">
		<li v-for="(storyPoints, i) in storyPointList" :key="i">
			<button type="button" class="" @click="emit('vote', storyPoints)">{{ storyPoints }}</button>
		</li>
	</ul>
</template>
