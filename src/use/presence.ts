import { ref, readonly } from 'vue'
import { supabase } from '@/supabase'
import type { UserOnline, StoredUser } from '@/types/User.type'

const hasJoined = ref(false)
const usersOnline = ref<Map<string, UserOnline>>(new Map())

const channel = supabase.channel('poker')
const joinChannel = (userData: StoredUser) => {
	channel
		.on('presence', { event: 'sync' }, () => {
			usersOnline.value.clear()
			Object.values(channel.presenceState()).forEach(presence => {
				const { presence_ref, ...entry } = presence[0]
				usersOnline.value.set(presence_ref, entry as UserOnline)
			})
		})
		.subscribe(async (status, error) => {
			if (status === 'SUBSCRIBED') {
				hasJoined.value = true
				await channel.track({ ...userData, online_at: new Date().toISOString() })
			}

			if (error) throw error
		})
}
const leaveChannel = async () => {
	channel.unsubscribe()
}

export const usePresence = () => ({
	hasJoined: readonly(hasJoined),
	usersOnline: readonly(usersOnline),
	joinChannel,
	leaveChannel,
})
