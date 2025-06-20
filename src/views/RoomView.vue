<script setup lang="ts">
import { ref, watch, onBeforeMount, onBeforeUnmount, computed } from 'vue'
import { useRoute, type RouteParamValue } from 'vue-router'
import { useStore } from '@/use/store'
import { usePresence } from '@/use/presence'
import type { Room } from '@/types/Room.type'
import type { StoredUser } from '@/types/User.type'
import { PROVIDE_SQIDS } from '@/keys'
import { injectStrict, createUuid, formatDate } from '@/use/helper'

const route = useRoute()

const sqids = injectStrict(PROVIDE_SQIDS)
const { state, realtimeSubscribe, realtimeUnsubscribe, fetchEntries } = useStore()

realtimeSubscribe()
onBeforeUnmount(() => {
	realtimeUnsubscribe()
})

const _roomId = sqids.decode(route.params.id as RouteParamValue).at(0)
const room = ref<Room | null | undefined>(null)
const _getRoom = async () => {
	await fetchEntries()
	room.value = state.rooms.find(item => item.id === _roomId)
}
watch(
	() => state.subscribed,
	_subscribed => {
		if (_subscribed) _getRoom()
	},
)

const { joinChannel, leaveChannel, hasJoined, usersOnline } = usePresence()

const _nameRestored = ref(false)
const showForm = computed(() => !(_nameRestored.value || hasJoined.value))

// @ts-expect-error JSON.parse(null) returns null
const storedUser: StoredUser | null = JSON.parse(window.localStorage.getItem('ocmScrumPoker'))
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

const isSubmitLocked = ref(false)
const onSubmitName = () => {
	if (isSubmitLocked.value || !name.value) return
	isSubmitLocked.value = true
	try {
		const userData: StoredUser = { name: name.value, uuid: createUuid() }
		joinChannel(userData)
		window.localStorage.setItem('ocmScrumPoker', JSON.stringify(userData))
	} catch (error) {
		console.error('Error joining channel / writing to local storage.', error)
	}
}

onBeforeUnmount(() => {
	leaveChannel()
})
</script>

<template>
	<main>
		<pre class="text-xs">{{ state.rooms }}</pre>

		<template v-if="room">
			<h1 class="text-2xl font-bold">Room {{ room.id }}</h1>
			<p>Erstellt am: {{ room.created_at }}</p>

			<template v-if="usersOnline.size">
				<pre class="text-xs">{{ usersOnline }}</pre>
				<ul>
					<li v-for="[key, user] of usersOnline" :key="key">
						{{ user.name }}: {{ formatDate(user.online_at, { time: true }) }}
					</li>
				</ul>
			</template>

			<form v-if="showForm" @submit.prevent="onSubmitName">
				<div>
					<label for="name">Stranger, what's your name?</label>
					<input type="text" id="name" v-model.trim="name" />
				</div>
				<button type="submit">Ok</button>
			</form>
		</template>

		<template v-else>
			{{ room === null ? 'Lade Daten …' : 'Ungültige Raum-ID' }}
		</template>
	</main>
</template>
