<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useStore } from '@/use/store'
import { PROVIDE_SQIDS } from '@/keys'
import { injectStrict } from '@/use/helper'

const router = useRouter()

const sqids = injectStrict(PROVIDE_SQIDS)
const { addEntry } = useStore()

const createRoom = async () => {
	const { id } = await addEntry()
	router.push({ name: 'view-room', params: { id: sqids.encode([id]) } })
}
</script>

<template>
	<main>
		<button type="button" @click="createRoom">Raum anlegen</button>
	</main>
</template>
