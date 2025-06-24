<script setup lang="ts">
import { ref, watch, onBeforeMount, onBeforeUnmount, computed } from 'vue'
import { useRoute, type RouteParamValue } from 'vue-router'
import PokerButtons from '@/components/PokerButtons.vue'
import PlayerList from '@/components/PlayerList.vue'
import { useStore } from '@/use/store'
import { usePlayers } from '@/use/players'
import type { StoredPlayer } from '@/types/Player.type'
import { PROVIDE_SQIDS } from '@/keys'
import { useFormHandling } from '@/use/formHandling'
import { injectStrict, createUuid, isEmpty } from '@/use/helper'

const route = useRoute()

const sqids = injectStrict(PROVIDE_SQIDS)
const { state, realtimeSubscribe, realtimeUnsubscribe, fetchRoom, startStory, toggleVoting, fetchStoryPoints } =
	useStore()

const { isSubmitLocked, beforeSubmit, unlockSubmit } = useFormHandling()

realtimeSubscribe()
onBeforeUnmount(() => {
	realtimeUnsubscribe()
})

const _setupRoom = async () => {
	const roomId = sqids.decode(route.params.id as RouteParamValue).at(0)
	await Promise.all([fetchRoom(roomId), fetchStoryPoints()])
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

const story = ref('')
watch(
	() => state.room?.story,
	_story => {
		story.value = _story ?? ''
	},
)
const isSubmitStoryLocked = computed(
	() => isSubmitLocked.value || isEmpty(story.value) || story.value === state.room?.story,
)
const onStartStory = async () => {
	if (isSubmitStoryLocked.value) return

	beforeSubmit()
	await startStory(story.value)
	unlockSubmit()
}

const isSubmitNameLocked = computed(() => isSubmitLocked.value || isEmpty(name.value))
const onSubmitName = () => {
	if (isSubmitNameLocked.value) return

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
</script>

<template>
	<main class="main container">
		<template v-if="state.room">
			<h1 class="text-2xl font-medium">{{ state.room.story }}</h1>
			<pre class="text-xs">{{ state.room }}</pre>

			<template v-if="state.authUser">
				<form @submit.prevent="onStartStory">
					<div>
						<label for="story">Story</label>
						<input type="text" id="story" v-model.trim="story" autocomplete="off" />
					</div>
					<button type="submit" :aria-disabled="isSubmitStoryLocked">Neue Story beginnen</button>
				</form>

				<button type="button" @click="toggleVoting">
					Voting {{ state.room.voting_enabled ? 'beenden' : 'starten' }}
				</button>
			</template>

			<template v-if="playersOnline.size">
				<!-- <pre class="text-xs">{{ state.storyPoints }}</pre> -->
				<PokerButtons class="py-8" :my-uuid />

				<!-- <pre class="text-xs">{{ playersOnline }}</pre> -->
				<PlayerList />
			</template>

			<form v-if="showForm" @submit.prevent="onSubmitName">
				<div>
					<label for="name">Stranger, what's your name?</label>
					<input type="text" id="name" v-model.trim="name" />
				</div>
				<button type="submit" :aria-disabled="isSubmitNameLocked">Ok</button>
			</form>
		</template>

		<template v-else>
			{{ state.room === null ? 'Lade Daten …' : 'Ungültige Raum-ID' }}
		</template>
	</main>
</template>
