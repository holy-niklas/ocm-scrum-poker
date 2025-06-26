<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useRoute, type RouteParamValue } from 'vue-router'
import PokerButtons from '@/components/PokerButtons.vue'
import PlayerList from '@/components/PlayerList.vue'
import NicknameDialog from '@/components/NicknameDialog.vue'
import { useStore } from '@/use/store'
import { usePlayers } from '@/use/players'
import { PROVIDE_SQIDS } from '@/keys'
import { useFormHandling } from '@/use/formHandling'
import { injectStrict, isEmpty } from '@/use/helper'

const route = useRoute()

const sqids = injectStrict(PROVIDE_SQIDS)
const { state, realtimeSubscribe, realtimeUnsubscribe, fetchRoom, startStory, toggleVoting, fetchStoryPoints } =
	useStore()
const { leaveChannel, myUuid, playersOnline } = usePlayers()

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

onBeforeUnmount(() => {
	leaveChannel()
})

const story = ref('')
watch(
	() => state.room?.story,
	_story => {
		story.value = _story ?? ''
	},
)

const { isSubmitLocked, beforeSubmit, unlockSubmit } = useFormHandling()
const isSubmitStoryLocked = computed(
	() => isSubmitLocked.value || isEmpty(story.value) || story.value === state.room?.story,
)
const onStartStory = async () => {
	if (isSubmitStoryLocked.value) return

	beforeSubmit()
	await startStory(story.value)
	unlockSubmit()
}
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

			<NicknameDialog :auth-user-id="state.authUser?.id" />
		</template>

		<template v-else>
			{{ state.room === null ? 'Lade Daten …' : 'Ungültige Raum-ID' }}
		</template>
	</main>
</template>
