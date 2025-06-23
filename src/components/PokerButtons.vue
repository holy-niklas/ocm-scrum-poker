<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '@/use/store'

const { state, addVote } = useStore()

const { myUuid } = defineProps<{
	myUuid: string
}>()

const storyPointList = ['?', '☕️', '1', '2', '3', '5', '8', '13', '20', '40', '100']
const distribution = computed(() => {
	const distribution = new Map<string, number>()
	state.storyPoints.forEach(vote => {
		distribution.set(vote, (distribution.get(vote) ?? 0) + 1)
	})
	return distribution
})

const vote = (storyPoints: string) => {
	addVote(myUuid, storyPoints)
}
</script>

<template>
	<ul class="flex flex-wrap gap-4">
		<li v-for="(storyPoints, i) in storyPointList" :key="i">
			<button type="button" @click="vote(storyPoints)">
				{{ storyPoints }}
				<small v-if="state.room?.voting_enabled === false" aria-hidden="true">{{
					distribution.get(storyPoints)
				}}</small>
			</button>
		</li>
	</ul>
</template>
