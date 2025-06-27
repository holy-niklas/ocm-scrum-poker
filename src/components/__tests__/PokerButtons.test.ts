import { reactive } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import PokerButtons from '@/components/PokerButtons.vue'
import type { Room } from '@/types/Room.type'
import { createUuid } from '@/use/helper'
import { mockRoom, mockStoryPoints } from './mock.data'

const _uuid = createUuid()

const state = reactive<{
	room: Room /* | null | undefined */
	storyPoints: Map<string, string>
}>({
	room: mockRoom(),
	storyPoints: new Map(),
})
vi.mock('@/use/store', () => ({
	useStore: () => ({ state }),
}))

const factory = () =>
	mount(PokerButtons, {
		props: {
			myUuid: _uuid,
		},
	})

describe('PokerButtons.vue', () => {
	let wrapper: ReturnType<typeof factory>
	const getPokerButtons = () => wrapper.findAll<HTMLButtonElement>('[data-test-poker-button]')
	const getAverageElement = () => wrapper.get<HTMLElement>('[data-test-average]')
	const average = (votes: string[]) => {
		const sum = votes.reduce((acc, val) => acc + +val, 0)
		return (sum / votes.length).toFixed(1)
	}

	beforeEach(() => {
		wrapper = factory()
		// state.room = mockRoom()
		state.room.voting_enabled = true
		state.storyPoints = new Map()
	})

	it('renders correctly', async () => {
		// expect(PokerButtons).toBeTruthy()
		expect(wrapper.exists()).toBe(true)

		const pokerButtons = getPokerButtons()
		// @ts-expect-error <script setup>
		const STORY_POINT_LIST = wrapper.vm.STORY_POINT_LIST as string[]

		expect(pokerButtons.length).toBe(STORY_POINT_LIST.length)

		const index = 5
		expect(pokerButtons.at(index)?.text()).toBe(STORY_POINT_LIST.at(index))

		const averageEl = getAverageElement()
		expect(averageEl.classes('invisible')).toBe(true)
	})

	it('shows average of none when voting is finished', async () => {
		const averageEl = getAverageElement()
		expect(averageEl.classes('invisible')).toBe(true)

		state.room.voting_enabled = false
		await flushPromises()

		// @ts-expect-error <script setup>
		expect(wrapper.vm.votingFinished).toBe(true)
		expect(averageEl.classes('invisible')).toBe(false)
		expect(averageEl.text()).toBe('Durchschnitt: —')
	})

	it('shows average of votes and distribution when voting is finished', async () => {
		const averageEl = getAverageElement()
		expect(averageEl.classes('invisible')).toBe(true)

		const VOTES = ['3', '5', '8', '8']
		state.storyPoints = mockStoryPoints(VOTES)

		state.room.voting_enabled = false
		await flushPromises()

		// @ts-expect-error <script setup>
		expect(wrapper.vm.votingFinished).toBe(true)
		expect(averageEl.classes('invisible')).toBe(false)
		expect(averageEl.text()).toBe(`Durchschnitt: ${average(VOTES)}`)

		expect(wrapper.findAll('[data-test-distribution]:not(:empty)').length).toBe(new Set([...VOTES]).size)
	})
})
