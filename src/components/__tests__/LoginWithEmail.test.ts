import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import LoginWithEmail from '@/components/LoginWithEmail.vue'

vi.mock('@/supabase', () => ({ supabase: { auth: { signInWithOtp: vi.fn(() => ({ error: null })) } } }))

const factory = () => mount(LoginWithEmail)

describe('LoginWithEmail.vue', () => {
	let wrapper: ReturnType<typeof factory>
	const getForm = () => wrapper.find<HTMLFormElement>('[data-test-form]')
	const getInput = () => wrapper.find<HTMLInputElement>('[data-test-input]')
	const getButton = () => wrapper.find<HTMLButtonElement>('[data-test-button]')

	beforeEach(() => {
		wrapper = factory()
	})

	it('renders email input and submit button', () => {
		const input = getInput()
		expect(input.exists()).toBe(true)
		const button = getButton()
		expect(button.exists()).toBe(true)
		expect(button.attributes('aria-disabled')).toBe('false')
	})

	it('does nothing when form is submitted but email is empty', async () => {
		const form = getForm()
		const button = getButton()
		await form.trigger('submit')
		expect(button.attributes('aria-disabled')).toBe('false')

		// @ts-expect-error <script setup>
		expect(wrapper.vm.isFirstStep).toBe(true)
	})

	it('changes the form to second step when email is submitted', async () => {
		const form = getForm()
		let input = getInput()
		const button = getButton()
		expect(input.attributes('id')).toBe('email')

		await input.setValue('test@example.com')
		await form.trigger('submit')

		expect(button.attributes('aria-disabled')).toBe('true')

		// @ts-expect-error <script setup>
		expect(wrapper.vm.isFirstStep).toBe(false)

		await flushPromises()
		input = getInput()
		expect(input.attributes('id')).toBe('code')
		expect(button.attributes('aria-disabled')).toBe('false')
	})
})
