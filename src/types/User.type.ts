export type UserOnline = {
	name: string
	online_at: string
	uuid: string
}

export type StoredUser = Omit<UserOnline, 'online_at'>
