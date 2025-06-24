import { ref, readonly } from 'vue'
import { supabase } from '@/supabase'
import type { Player, StoredPlayer } from '@/types/Player.type'
// import type { REALTIME_LISTEN_TYPES } from '@supabase/supabase-js'

const myUuid = ref<StoredPlayer['uuid']>('')
const playersOnline = ref<Map<string, Player>>(new Map())

const channel = supabase.channel('poker')
channel.on('presence', { event: 'sync' }, () => {
	playersOnline.value.clear()
	Object.values(channel.presenceState()).forEach(presence => {
		const { presence_ref, ...entry } = presence[0]
		playersOnline.value.set(presence_ref, entry as Player)
	})
})

const joinChannel = (userData: StoredPlayer) => {
	// already joined
	if (!!myUuid.value) return

	channel.subscribe(async (status, error) => {
		if (error) throw error
		if (status !== 'SUBSCRIBED') return

		myUuid.value = userData.uuid
		await channel.track({ ...userData, online_at: new Date().toISOString() })
	})
}

const leaveChannel = async () => {
	channel.unsubscribe()
}

// type BroadCastPayload = {
// 	// eslint-disable-next-line @typescript-eslint/no-explicit-any
// 	[key: string]: any
// 	type: `${REALTIME_LISTEN_TYPES.BROADCAST}`
// 	event: string
// }
// const storyPoints = ref<Map<string, string>>(new Map())
// const _onVoteReceived = ({ payload }: BroadCastPayload) => {
// 	if (!payload.uuid || !payload.storyPoints) return

// 	storyPoints.value.set(payload.uuid, payload.storyPoints)
// }
// channel.on(
// 	'broadcast',
// 	{ event: 'shout' }, // listen for "shout". Can be "*" to listen to all events
// 	payload => _onVoteReceived(payload),
// )

// const vote = async (myStoryPoints: string) => {
// 	if (!myUuid.value) return

// 	storyPoints.value.set(myUuid.value, myStoryPoints)
// 	channel.send({
// 		type: 'broadcast',
// 		event: 'shout',
// 		payload: { uuid: myUuid.value, storyPoints: myStoryPoints },
// 	})
// }

export const usePlayers = () => ({
	myUuid: readonly(myUuid),
	playersOnline: readonly(playersOnline),
	joinChannel,
	leaveChannel,
})
