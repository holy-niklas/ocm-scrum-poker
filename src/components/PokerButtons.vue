<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '@/use/store'

const { state, addVote } = useStore()

const { myUuid } = defineProps<{
	myUuid: string
}>()

const votingFinished = computed(() => state.room?.voting_enabled === false)

const STORY_POINT_LIST = ['?', '☕️', '1', '2', '3', '5', '8', '13', '20', '40', '100']

const distribution = computed(() => {
	const distribution = new Map<string, number>()
	state.storyPoints.forEach(vote => {
		distribution.set(vote, (distribution.get(vote) ?? 0) + 1)
	})
	return distribution
})
const average = computed(() => {
	if (!state.storyPoints.size) return 0

	const numbers = Array.from(state.storyPoints.values()).filter(val => !isNaN(+val))
	const sum = numbers.reduce((acc, val) => acc + +val, 0)
	return (sum / numbers.length).toFixed(1)
})
</script>

<template>
	<div v-if="votingFinished">Durchschnitt: {{ average }}</div>

	<ul class="flex flex-wrap gap-4">
		<li v-for="(storyPoints, i) in STORY_POINT_LIST" :key="i">
			<button type="button" @click="addVote(myUuid, storyPoints)">
				{{ storyPoints }}
				<small v-if="votingFinished" aria-hidden="true">{{ distribution.get(storyPoints) }}</small>
			</button>
		</li>
	</ul>
</template>
