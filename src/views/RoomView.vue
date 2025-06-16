<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { useRoute, type RouteParamValue } from 'vue-router'
import { useStore } from '@/use/store'
import type { Room } from '@/types/Room.type'
import { PROVIDE_SQIDS } from '@/keys'
import { injectStrict } from '@/use/helper'

const route = useRoute()

const sqids = injectStrict(PROVIDE_SQIDS)
const { state, realtimeSubscribe, realtimeUnsubscribe, fetchEntries } = useStore()
realtimeSubscribe()

watch(
	() => state.subscribed,
	subscribed => {
		if (subscribed) _getRoom()
	},
)
onBeforeUnmount(() => {
	realtimeUnsubscribe()
})

const _roomId = sqids.decode(route.params.id as RouteParamValue).at(0)
const room = ref<Room | null | undefined>(null)
const _getRoom = async () => {
	await fetchEntries()
	room.value = state.rooms.find(item => item.id === _roomId)
}
</script>

<template>
	<main>
		<pre class="text-xs">{{ state.rooms }}</pre>

		<template v-if="room">
			<h1 class="text-2xl font-bold">Raum {{ room.id }}</h1>
			<p>Erstellt am: {{ room.created_at }}</p>
		</template>

		<template v-else>
			{{ room === null ? 'Lade Daten …' : 'Ungültige Raum-ID' }}
		</template>
	</main>
</template>
