export type Room = {
	id: number
	user_id: string // uuid
	story: string
	voting_enabled: boolean
	created_at: string
	version: number
}
