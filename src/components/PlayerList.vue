<script setup lang="ts">
import { useStore } from '@/use/store'
import { usePlayers } from '@/use/players'
// import { formatDate } from '@/use/helper'

const { state } = useStore()
const { playersOnline } = usePlayers()

const getStoryPoints = (uuid: string) => {
	const storyPoints = state.storyPoints.get(uuid)
	return storyPoints && state.room?.voting_enabled ? '🙈' : storyPoints
}
</script>

<template>
	<table class="player-table">
		<thead>
			<tr>
				<th>User</th>
				<th>Storypoints</th>
			</tr>
		</thead>

		<tbody>
			<tr v-for="[key, player] of playersOnline" :key="key">
				<td>
					{{ player.name }} <span v-if="player.uuid === state.room?.user_id">⭐️</span>
					<!-- <small>({{ formatDate(player.online_at, { time: true }) }})</small> -->
				</td>
				<td>
					<span :data-points="getStoryPoints(player.uuid)">
						{{ getStoryPoints(player.uuid) }}
					</span>
				</td>
			</tr>
		</tbody>
	</table>
</template>

<style lang="postcss">
.player-table {
	@apply rounded shadow;
	table-layout: fixed;
	background-color: var(--white);
	width: 100%;

	:is(th, td) {
		@apply p-4;
	}

	th {
		font-weight: 600;
		text-align: left;
	}

	td {
		@apply border-t border-gray-300;
		position: relative;

		& :is([data-points='🙈'], [data-points='☕️']) {
			@apply text-3xl;
			position: absolute;
			translate: 0 -50%;
		}
	}
}
</style>
