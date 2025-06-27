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
	const numbers = Array.from(state.storyPoints.values()).filter(val => !isNaN(+val))
	if (!numbers.length || !votingFinished.value) return '—'

	const sum = numbers.reduce((acc, val) => acc + +val, 0)
	return (sum / numbers.length).toFixed(1)
})
</script>

<template>
	<div>
		<div class="mb-4 font-medium" :class="{ invisible: !votingFinished }" data-test-average>
			Durchschnitt: {{ average }}
		</div>

		<ul class="flex flex-wrap justify-center gap-4">
			<li v-for="(storyPoints, i) in STORY_POINT_LIST" :key="i">
				<button
					type="button"
					class="poker-button"
					:aria-disabled="votingFinished"
					:data-points="storyPoints"
					data-test-poker-button
					@click="addVote(myUuid, storyPoints)"
				>
					{{ storyPoints }}
					<span v-if="votingFinished" class="distribution" aria-hidden="true" data-test-distribution>{{
						distribution.get(storyPoints)
					}}</span>
				</button>
			</li>
		</ul>
	</div>
</template>

<style lang="postcss">
.poker-button {
	@apply h-28 w-20 rounded;
	display: grid;
	place-content: center;
	position: relative;
	font-size: 2rem;

	&[data-points='☕️'] {
		font-size: 3.25rem;
	}
}

.distribution {
	@apply shadow;
	position: absolute;
	top: 0;
	right: 0;
	min-width: 1.5rem;
	height: 1.5rem;
	translate: 50% -50%;
	border-radius: 50%;
	background-color: var(--dark-700);
	color: var(--white);
	display: grid;
	place-content: center;
	font-size: 1rem;

	&:empty {
		display: none;
	}
}
</style>
