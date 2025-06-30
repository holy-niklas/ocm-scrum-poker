<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '@/use/store'

const { state, addVote } = useStore()

const { myUuid } = defineProps<{
	myUuid: string
}>()

const votingFinished = computed(() => state.room?.voting_enabled === false)

const STORY_POINT_LIST = ['0', '1', '2', '3', '5', '8', '13', '20', '40', '100', /* '∞', */ '?', '☕️']

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
			<li v-for="(storyPoints, i) in STORY_POINT_LIST" class="poker-button-parent" :key="i">
				<button
					type="button"
					class="poker-button"
					:class="{ 'voting-enabled': !votingFinished }"
					:aria-label="storyPoints"
					:aria-disabled="votingFinished"
					:data-points="storyPoints"
					data-test-poker-button
					@click="addVote(myUuid, storyPoints)"
				>
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
	@apply w-22 rounded;
	aspect-ratio: 2/3;
	display: grid;
	place-content: center;
	position: relative;
	font-size: 2rem;

	border-color: var(--white);
	background-color: var(--white);
	background-size: 134% auto;
	background-position: center;
	--drop-shadow: oklch(0 0 0 / 20%);

	transform: translateZ(var(--translate-z, 0));
	filter: drop-shadow(1px 2px 0.25rem var(--drop-shadow));
	transition:
		transform 120ms ease-out,
		filter 120ms ease-out;

	/* &[data-points='☕️'] {
		font-size: 3.25rem;
	} */

	&[data-points='?'] {
		background-image: url('@/assets/cards/card-unknown.jpeg');
	}
	&[data-points='☕️'] {
		background-image: url('@/assets/cards/card-break.jpeg');
	}
	&[data-points='0'] {
		background-image: url('@/assets/cards/card-0.jpeg');
	}
	&[data-points='1'] {
		background-image: url('@/assets/cards/card-01.jpeg');
	}
	&[data-points='2'] {
		background-image: url('@/assets/cards/card-02.jpeg');
	}
	&[data-points='3'] {
		background-image: url('@/assets/cards/card-03.jpeg');
	}
	&[data-points='5'] {
		background-image: url('@/assets/cards/card-05.jpeg');
	}
	&[data-points='8'] {
		background-image: url('@/assets/cards/card-08.jpeg');
	}
	&[data-points='13'] {
		background-image: url('@/assets/cards/card-13.jpeg');
	}
	&[data-points='20'] {
		background-image: url('@/assets/cards/card-20.jpeg');
	}
	&[data-points='40'] {
		background-image: url('@/assets/cards/card-40.jpeg');
	}
	&[data-points='100'] {
		background-image: url('@/assets/cards/card-100.jpeg');
	}
	&[data-points='∞'] {
		background-image: url('@/assets/cards/card-infinity.jpeg');
	}

	@media (hover: hover) and (pointer: fine) {
		&.voting-enabled:hover {
			/* scale: 1.5; */
			/**
			 * (perspective * (scale - 1)) / scale;
			 * https://jakearchibald.com/2025/animating-zooming/
			 */
			--translate-z: 333.3333333px;
			filter: drop-shadow(2px 4px 1rem var(--drop-shadow));

			&:active {
				outline-color: transparent;
				--translate-z: 310px;
			}
		}
	}
}

@media (hover: hover) and (pointer: fine) {
	.poker-button-parent {
		position: relative;
		z-index: 0;
		perspective: 1000px;

		&:has(.poker-button.voting-enabled:hover) {
			z-index: 1;
		}
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
