import { reactive, computed, readonly } from 'vue'
import type {
	Session,
	RealtimePostgresInsertPayload,
	RealtimePostgresUpdatePayload,
	PostgrestSingleResponse,
} from '@supabase/supabase-js'
import { supabase } from '@/supabase'
import type { Room } from '@/types/Room.type'
import type { StoryPointsTable } from '@/types/StoryPoints'
import type { StoredPlayer } from '@/types/Player.type'

const state = reactive<{
	room: Room | null | undefined
	storyPoints: Map<StoryPointsTable['user_id'], StoryPointsTable['vote']>
	subscribed: boolean
	authUser: { id: string } | null
}>({
	room: null,
	storyPoints: new Map(),
	subscribed: false,
	authUser: null,
})

const isAuthenticated = computed(() => state.authUser !== null)
const setAuthState = (session: Session | null) => {
	state.authUser = session !== null ? { id: session.user.id } : null
}

const _onDatabaseInsert = (payload: RealtimePostgresInsertPayload<StoryPointsTable>) => {
	if (payload.table !== 'storypoints') return

	const newEntry = payload.new as StoryPointsTable | null
	if (!newEntry) return

	state.storyPoints.set(newEntry.user_id, newEntry.vote)
}

const _onDatabaseUpdate = (payload: RealtimePostgresUpdatePayload<Room>) => {
	if (payload.table !== 'rooms') return

	const updatedEntry = payload.new as Room | null
	if (!updatedEntry) return

	const isNewStory = (state.room?.version ?? 1) < updatedEntry.version
	if (isNewStory) state.storyPoints.clear()

	state.room = updatedEntry
}

const realtimeSubscribe = () => {
	if (state.subscribed) return

	supabase
		.channel('schema-db-changes')
		.on('postgres_changes', { event: 'INSERT', schema: 'public' }, _onDatabaseInsert)
		.on('postgres_changes', { event: 'UPDATE', schema: 'public' }, _onDatabaseUpdate)
		.subscribe((status, error) => {
			if (status === 'SUBSCRIBED') state.subscribed = true
			if (error) throw error
		})
}

const realtimeUnsubscribe = async () => {
	const status = await supabase.channel('schema-db-changes').unsubscribe()
	if (status === 'ok') state.subscribed = false
}

const fetchRoom = async (roomId?: number) => {
	if (roomId === undefined) {
		state.room = undefined
		return
	}

	try {
		const { data, error /* , status */ }: PostgrestSingleResponse<Room[]> = await supabase
			.from('rooms')
			.select()
			.eq('id', roomId)
		if (error) throw error
		if (data === null) throw new Error('Verbindung zur Datenbank fehlgeschlagen.')

		state.room = data.at(0)
	} catch (error) {
		const message = (error as Error).message ?? 'Verbindung zum Server fehlgeschlagen.'
		console.error(message)
	}
}

const addRoom = async () => {
	if (!state.authUser) return

	try {
		const payload = { user_id: state.authUser.id }
		const { data, error }: PostgrestSingleResponse<Room[]> = await supabase.from('rooms').insert(payload).select()
		if (error) throw error
		if (data === null) throw new Error('Verbindung zur Datenbank fehlgeschlagen.')

		return data.at(0)
	} catch (error) {
		const message = (error as Error).message ?? 'Verbindung zum Server fehlgeschlagen.'
		console.error(message)
	}
}

const startStory = async (story: string) => {
	if (!state.authUser || !state.room) return

	try {
		const payload = { story, voting_enabled: true, version: state.room.version + 1 }
		const [{ error }, { error: anotherError }] = await Promise.all([
			supabase.from('rooms').update(payload).eq('id', state.room.id),
			supabase.from('storypoints').delete().eq('room_id', state.room.id),
		])
		if (error) throw error
		if (anotherError) throw anotherError
	} catch (error) {
		const message = (error as Error).message ?? 'Verbindung zum Server fehlgeschlagen.'
		console.error(message)
	}
}

const toggleVoting = async () => {
	if (!state.authUser || !state.room) return

	try {
		const payload = { voting_enabled: !state.room.voting_enabled }
		const { error } = await supabase.from('rooms').update(payload).eq('id', state.room.id)
		if (error) throw error
	} catch (error) {
		const message = (error as Error).message ?? 'Verbindung zum Server fehlgeschlagen.'
		console.error(message)
	}
}

const fetchStoryPoints = async () => {
	if (!state.room) return

	try {
		const { data, error /* , status */ }: PostgrestSingleResponse<Pick<StoryPointsTable, 'user_id' | 'vote'>[]> =
			await supabase
				.from('storypoints')
				.select('user_id, vote')
				.eq('room_id', state.room.id)
				.order('id', { ascending: false })

		if (error) throw error
		if (data === null) throw new Error('Verbindung zur Datenbank fehlgeschlagen.')

		data.forEach(({ user_id, vote }) => {
			if (!state.storyPoints.has(user_id)) {
				state.storyPoints.set(user_id, vote)
			}
		})
	} catch (error) {
		const message = (error as Error).message ?? 'Verbindung zum Server fehlgeschlagen.'
		console.error(message)
	}
}

const addVote = async (uuid: StoredPlayer['uuid'], vote: string) => {
	if (!state.room?.voting_enabled) return

	try {
		const payload = { room_id: state.room.id, user_id: uuid, vote }
		const { error } = await supabase.from('storypoints').insert(payload)
		if (error) throw error
	} catch (error) {
		const message = (error as Error).message ?? 'Verbindung zum Server fehlgeschlagen.'
		console.error(message)
	}
}

// Singleton State Pattern, see https://markus.oberlehner.net/blog/vue-composition-api-composables/#the-singleton-state-pattern
export const useStore = () => ({
	state: readonly(state),
	isAuthenticated,
	setAuthState,
	realtimeSubscribe,
	realtimeUnsubscribe,
	fetchRoom,
	addRoom,
	startStory,
	toggleVoting,
	fetchStoryPoints,
	addVote,
})
