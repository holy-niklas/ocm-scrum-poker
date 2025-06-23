<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useStore } from '@/use/store'
import { PROVIDE_SQIDS } from '@/keys'
import { useFormHandling } from '@/use/formHandling'
import { injectStrict } from '@/use/helper'

const router = useRouter()

const sqids = injectStrict(PROVIDE_SQIDS)
const { isAuthenticated, addRoom } = useStore()

const { isSubmitLocked, beforeSubmit } = useFormHandling()

const createRoom = async () => {
	if (isSubmitLocked.value) return

	beforeSubmit()
	const room = await addRoom()
	if (!room) return
	router.push({ name: 'room', params: { id: sqids.encode([room.id]) } })
}
</script>

<template>
	<main>
		<template v-if="isAuthenticated">
			<button type="button" :aria-disabled="isSubmitLocked" @click="createRoom">Neuen Raum anlegen</button>
		</template>
	</main>
</template>
