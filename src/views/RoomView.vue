<script setup lang="ts">
import { ref, watch, onBeforeMount, onBeforeUnmount, computed } from 'vue'
import { useRoute, type RouteParamValue } from 'vue-router'
import PokerButtons from '@/components/PokerButtons.vue'
import { useStore } from '@/use/store'
import { usePlayers } from '@/use/players'
import type { Room } from '@/types/Room.type'
import type { StoredPlayer } from '@/types/Player.type'
import { PROVIDE_SQIDS } from '@/keys'
import { useFormHandling } from '@/use/formHandling'
import { injectStrict, createUuid, formatDate, isEmpty } from '@/use/helper'

const route = useRoute()

const sqids = injectStrict(PROVIDE_SQIDS)
const { state, realtimeSubscribe, realtimeUnsubscribe, fetchRooms, fetchStoryPoints, addStoryPoints } = useStore()

const { isSubmitLocked, beforeSubmit } = useFormHandling()

realtimeSubscribe()
onBeforeUnmount(() => {
	realtimeUnsubscribe()
})

const _roomId = sqids.decode(route.params.id as RouteParamValue).at(0)
const room = ref<Room | null | undefined>(null)
const _setupRoom = async () => {
	await fetchRooms()
	room.value = state.rooms.find(item => item.id === _roomId)

	if (room.value) await fetchStoryPoints(room.value.id)
}
watch(
	() => state.subscribed,
	_subscribed => {
		if (_subscribed) _setupRoom()
	},
)

const { joinChannel, leaveChannel, myUuid, playersOnline } = usePlayers()

const _nameRestored = ref(false)
const showForm = computed(() => !(_nameRestored.value || myUuid.value))

// @ts-expect-error JSON.parse(null) returns null
const storedUser: StoredPlayer | null = JSON.parse(window.localStorage.getItem('ocmScrumPoker'))
const name = ref(storedUser?.name ?? '')
const _onNameRestored = () => {
	if (!storedUser) return
	_nameRestored.value = true
	try {
		joinChannel(storedUser)
	} catch (error) {
		console.error('Error joining channel.', error)
	}
}
onBeforeMount(() => {
	_onNameRestored()
})

const onSubmitName = () => {
	if (isSubmitLocked.value || isEmpty(name)) return

	beforeSubmit()
	try {
		const userData: StoredPlayer = { name: name.value, uuid: state.authUser?.id ?? createUuid() }
		joinChannel(userData)
		window.localStorage.setItem('ocmScrumPoker', JSON.stringify(userData))
	} catch (error) {
		console.error('Error joining channel / writing to local storage.', error)
	}
}

onBeforeUnmount(() => {
	leaveChannel()
})

const onVote = (storyPoints: string) => {
	if (!room.value) return
	addStoryPoints(room.value.id, myUuid.value, storyPoints)
}
</script>

<template>
	<main>
		<template v-if="room">
			<h1 class="text-2xl font-bold">Room {{ room.id }}</h1>
			<p>Erstellt am: {{ room.created_at }}</p>
			<pre class="text-xs">{{ room }}</pre>

			<template v-if="playersOnline.size">
				<PokerButtons @vote="onVote" />

				<!-- <pre class="text-xs">{{ playersOnline }}</pre> -->
				<table>
					<thead>
						<tr>
							<th>User</th>
							<th>Storypoints</th>
						</tr>
					</thead>

					<tbody>
						<tr v-for="[key, player] of playersOnline" :key="key">
							<td>
								{{ player.name }} <span v-if="player.uuid === room.user_id">⭐️</span>
								<small>({{ formatDate(player.online_at, { time: true }) }})</small>
							</td>
							<td>
								{{ state.storyPoints.get(player.uuid) }}
							</td>
						</tr>
					</tbody>
				</table>
			</template>

			<form v-if="showForm" @submit.prevent="onSubmitName">
				<div>
					<label for="name">Stranger, what's your name?</label>
					<input type="text" id="name" v-model.trim="name" />
				</div>
				<button type="submit" :aria-disabled="isSubmitLocked">Ok</button>
			</form>
		</template>

		<template v-else>
			{{ room === null ? 'Lade Daten …' : 'Ungültige Raum-ID' }}
		</template>
	</main>
</template>
