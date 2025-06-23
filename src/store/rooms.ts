import { reactive, computed, readonly } from 'vue'
import type { RealtimePostgresUpdatePayload, Session } from '@supabase/supabase-js'
import { supabase } from '@/supabase'
import type { Room } from '@/types/Room.type'

const state = reactive<{
	rooms: Room[]
	subscribed: boolean
	authUser: { id: string } | null
}>({
	rooms: [],
	subscribed: false,
	authUser: null,
})

const isAuthenticated = computed(() => state.authUser !== null)

const _onDatabaseUpdate = (payload: RealtimePostgresUpdatePayload<Room>) => {
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

const fetchEntries = async () => {
	try {
		const { data, error /* , status */ } = await supabase.from('rooms').select().order('id', { ascending: true })
		if (error) throw error
		if (data === null) throw new Error('Verbindung zur Datenbank fehlgeschlagen.')

		state.rooms = data
	} catch (error) {
		const message = (error as Error).message ?? 'Verbindung zum Server fehlgeschlagen.'
		console.error(message)
	}
}

const addEntry = async () => {
	if (!state.authUser) return

	try {
		const { data, error } = await supabase.from('rooms').insert({ user_id: state.authUser.id }).select()
		if (error) throw error
		if (data === null) throw new Error('Verbindung zur Datenbank fehlgeschlagen.')
		return data.at(0)
	} catch (error) {
		const message = (error as Error).message ?? 'Verbindung zum Server fehlgeschlagen.'
		console.error(message)
	}
}

// const updateEntry = async (id: number, data: Room) => {
// 	try {
// 		const { error } = await supabase.from('rooms').update(data).eq('id', id) /* .select() */
// 		if (error) throw error
// 	} catch (error) {
// 		const message = (error as Error).message ?? 'Verbindung zum Server fehlgeschlagen.'
// 		console.error(message)
// 	}
// }

const setAuthState = (session: Session | null) => {
	state.authUser = session !== null ? { id: session.user.id } : null
}

// Singleton State Pattern, see https://markus.oberlehner.net/blog/vue-composition-api-composables/#the-singleton-state-pattern
export const useRoomStore = () => ({
	state: readonly(state),
	isAuthenticated,
	realtimeSubscribe,
	realtimeUnsubscribe,
	fetchEntries,
	addEntry,
	// updateEntry,
	setAuthState,
})
