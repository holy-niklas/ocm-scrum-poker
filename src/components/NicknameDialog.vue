<script setup lang="ts">
import { ref, useTemplateRef, computed, watch, onMounted } from 'vue'
import { usePlayers } from '@/use/players'
import type { StoredPlayer } from '@/types/Player.type'
import { useFormHandling } from '@/use/formHandling'
import { createUuid, isEmpty } from '@/use/helper'

const { authUserId } = defineProps<{
	// eslint-disable-next-line vue/require-default-prop
	authUserId?: string
}>()

const { joinChannel, myUuid } = usePlayers()

const dialogEl = useTemplateRef('dialogEl')
watch(
	myUuid,
	async _myUuid => {
		if (_myUuid) dialogEl.value?.close()
	},
	{ once: true },
)

// @ts-expect-error JSON.parse(null) returns null
const storedUser: StoredPlayer | null = JSON.parse(window.localStorage.getItem('ocmScrumPoker'))
const name = ref(storedUser?.name ?? '')
const _nameRestored = ref(false)

const _onNameRestored = () => {
	if (!storedUser) return
	_nameRestored.value = true
	try {
		joinChannel(storedUser)
	} catch (error) {
		console.error('Error joining channel.', error)
	}
}
_onNameRestored()

onMounted(() => {
	if (!(_nameRestored.value /* || myUuid.value */)) dialogEl.value?.showModal()
})

const { isSubmitLocked, beforeSubmit } = useFormHandling()
const isSubmitNameLocked = computed(() => isSubmitLocked.value || isEmpty(name.value))
const onSubmitName = () => {
	if (isSubmitNameLocked.value) return

	beforeSubmit()
	try {
		const userData: StoredPlayer = { name: name.value, uuid: authUserId ?? createUuid() }
		joinChannel(userData)
		window.localStorage.setItem('ocmScrumPoker', JSON.stringify(userData))
	} catch (error) {
		console.error('Error joining channel / writing to local storage.', error)
	}
}
</script>

<template>
	<dialog ref="dialogEl">
		<h2>Please enter your Nickname</h2>
		<div>This is the name that will be displayed to other users in the room.</div>

		<form @submit.prevent="onSubmitName">
			<div>
				<label for="nickname">Nickname</label>
				<input v-model.trim="name" type="text" id="nickname" maxlength="32" required />
			</div>
			<button type="submit" :aria-disabled="isSubmitNameLocked">Ok</button>
		</form>
	</dialog>
</template>
