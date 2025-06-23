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
	rooms: Room[]
	storyPoints: Map<StoryPointsTable['user_id'], StoryPointsTable['vote']>
	subscribed: boolean
	authUser: { id: string } | null
}>({
	rooms: [],
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

	const newEntry = payload.new as Room | null
	if (!newEntry) return

	const index = state.rooms.findIndex(room => room.id === newEntry.id)
	if (index === -1) return
	state.rooms[index] = newEntry
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

const fetchRooms = async () => {
	try {
		const { data, error /* , status */ }: PostgrestSingleResponse<Room[]> = await supabase
			.from('rooms')
			.select()
			.order('id', { ascending: true })
		if (error) throw error
		if (data === null) throw new Error('Verbindung zur Datenbank fehlgeschlagen.')

		state.rooms = data
	} catch (error) {
		const message = (error as Error).message ?? 'Verbindung zum Server fehlgeschlagen.'
		console.error(message)
	}
}

const addRoom = async () => {
	if (!state.authUser) return

	try {
		const { data, error }: PostgrestSingleResponse<Room[]> = await supabase
			.from('rooms')
			.insert({ user_id: state.authUser.id })
			.select()
		if (error) throw error
		if (data === null) throw new Error('Verbindung zur Datenbank fehlgeschlagen.')

		return data.at(0)
	} catch (error) {
		const message = (error as Error).message ?? 'Verbindung zum Server fehlgeschlagen.'
		console.error(message)
	}
}

// const updateRoom = async (id: number, data: Room) => {
// 	try {
// 		const { error } = await supabase.from('rooms').update(data).eq('id', id) /* .select() */
// 		if (error) throw error
// 	} catch (error) {
// 		const message = (error as Error).message ?? 'Verbindung zum Server fehlgeschlagen.'
// 		console.error(message)
// 	}
// }

const fetchStoryPoints = async (roomId: number) => {
	try {
		const { data, error /* , status */ }: PostgrestSingleResponse<Pick<StoryPointsTable, 'user_id' | 'vote'>[]> =
			await supabase.from('storypoints').select('user_id, vote').eq('room_id', roomId).order('id', { ascending: false })

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

const addStoryPoints = async (roomId: number, uuid: StoredPlayer['uuid'], storyPoints: string) => {
	try {
		const { error } = await supabase.from('storypoints').insert({ room_id: roomId, user_id: uuid, vote: storyPoints })
		// .select()
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
	fetchRooms,
	addRoom,
	// updateRoom,
	fetchStoryPoints,
	addStoryPoints,
})
