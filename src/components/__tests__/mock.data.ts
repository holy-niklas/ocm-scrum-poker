import type { Room } from '@/types/Room.type'
import { createUuid } from '@/use/helper'

export const mockRoom = (): Room => ({
	id: 123,
	user_id: createUuid(),
	story: 'Test Story',
	voting_enabled: true,
	created_at: new Date().toISOString(),
	version: 1,
})

export const mockStoryPoints = (votes: string[]) => {
	const storyPoints = new Map<string, string>()
	votes.forEach(vote => {
		storyPoints.set(createUuid(), vote)
	})
	return storyPoints
}
