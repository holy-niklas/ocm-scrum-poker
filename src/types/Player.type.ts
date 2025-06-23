export type Player = {
	name: string
	online_at: string
	uuid: string
}

export type StoredPlayer = Omit<Player, 'online_at'>
