import { reactive, readonly } from 'vue'
import type { RealtimePostgresUpdatePayload } from '@supabase/supabase-js'
import { supabase } from '@/supabase'
import type { Room } from '@/types/Room.type'

const state = reactive<{
	rooms: Room[]
	subscribed: boolean
	isAuthenticated: boolean
}>({
	rooms: [],
	subscribed: false,
	isAuthenticated: false,
})

const _onUpdate = (payload: RealtimePostgresUpdatePayload<{ [key: string]: unknown }>) => {
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
		.on('postgres_changes', { event: 'UPDATE', schema: 'public' }, _onUpdate)
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
	// if (!state.isAuthenticated) return

	try {
		const { data, error } = await supabase.from('rooms').insert({}).select()
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

const setAuthState = (isAuthenticated = false) => {
	state.isAuthenticated = isAuthenticated
}

// Singleton State Pattern, see https://markus.oberlehner.net/blog/vue-composition-api-composables/#the-singleton-state-pattern
export const useStore = () => ({
	state: readonly(state),
	realtimeSubscribe,
	realtimeUnsubscribe,
	fetchEntries,
	addEntry,
	// updateEntry,
	setAuthState,
})
