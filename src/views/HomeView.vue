<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useRoomStore } from '@/store/rooms'
import { PROVIDE_SQIDS } from '@/keys'
import { injectStrict } from '@/use/helper'

const router = useRouter()

const sqids = injectStrict(PROVIDE_SQIDS)
const { state, addEntry } = useRoomStore()

const createRoom = async () => {
	const { id } = await addEntry()
	router.push({ name: 'room', params: { id: sqids.encode([id]) } })
}
</script>

<template>
	<main>
		<template v-if="state.isAuthenticated">
			<button type="button" @click="createRoom">Neuen Raum anlegen</button>
		</template>
	</main>
</template>
