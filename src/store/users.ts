import { ref, computed, readonly } from 'vue'
import { supabase } from '@/supabase'
import type { UserOnline, StoredUser } from '@/types/User.type'
import type { REALTIME_LISTEN_TYPES } from '@supabase/supabase-js'

const _uuid = ref('')
const hasJoined = computed(() => _uuid.value !== '')
const usersOnline = ref<Map<string, UserOnline>>(new Map())

const channel = supabase.channel('poker')
channel.on('presence', { event: 'sync' }, () => {
	usersOnline.value.clear()
	Object.values(channel.presenceState()).forEach(presence => {
		const { presence_ref, ...entry } = presence[0]
		usersOnline.value.set(presence_ref, entry as UserOnline)
	})
})

const joinChannel = (userData: StoredUser) => {
	channel.subscribe(async (status, error) => {
		if (error) throw error
		if (status !== 'SUBSCRIBED') return

		_uuid.value = userData.uuid
		await channel.track({ ...userData, online_at: new Date().toISOString() })
	})
}

const leaveChannel = async () => {
	channel.unsubscribe()
}

type BroadCastPayload = {
	[key: string]: any
	type: `${REALTIME_LISTEN_TYPES.BROADCAST}`
	event: string
}
const userStoryPoints = ref<Map<string, string>>(new Map())
const onMessageReceived = ({ payload }: BroadCastPayload) => {
	if (!payload.uuid || !payload.storyPoints) return

	userStoryPoints.value.set(payload.uuid, payload.storyPoints)
}
channel.on(
	'broadcast',
	{ event: 'shout' }, // listen for "shout". Can be "*" to listen to all events
	payload => onMessageReceived(payload),
)

const vote = async (storyPoints: string) => {
	if (!hasJoined.value) return

	userStoryPoints.value.set(_uuid.value, storyPoints)
	channel.send({
		type: 'broadcast',
		event: 'shout',
		payload: { uuid: _uuid.value, storyPoints },
	})
}

export const useUserStore = () => ({
	hasJoined,
	usersOnline: readonly(usersOnline),
	joinChannel,
	leaveChannel,
	userStoryPoints: readonly(userStoryPoints),
	vote,
})
