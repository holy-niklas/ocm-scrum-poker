<script setup lang="ts">
import { ref, useTemplateRef, watch, nextTick } from 'vue'
import type { AuthError } from '@supabase/supabase-js'
import { supabase } from '@/supabase'
import { useFormHandling } from '@/use/formHandling'
import { isEmpty } from '@/use/helper'

const { isSubmitLocked, beforeSubmit, handleSubmitError, unlockSubmit } = useFormHandling()

const email = ref('')
const passcode = ref('')
watch(passcode, input => {
	if (input.length === 6) onSubmit()
})

const formEl = useTemplateRef('formEl')
const isFirstStep = ref(true)
watch(isFirstStep, async () => {
	await nextTick()
	formEl.value?.querySelector('input')?.focus()
	unlockSubmit()
})

const onSubmit = () => {
	if (isFirstStep.value) _onSubmitEmail()
	else _onSubmitCode()
}

const _onSubmitEmail = async () => {
	if (isSubmitLocked.value || isEmpty(email)) return

	beforeSubmit()
	try {
		const { error } = await supabase.auth.signInWithOtp({
			email: email.value,
			// options: { shouldCreateUser: false },
		})
		if (error) throw error

		isFirstStep.value = false
	} catch (error) {
		handleSubmitError(error)
	}
}

const _onSubmitCode = async () => {
	if (isSubmitLocked.value || isEmpty(passcode)) return

	beforeSubmit()
	try {
		const { error } = await supabase.auth.verifyOtp({ email: email.value, token: passcode.value, type: 'email' })
		if (error) throw error
	} catch (error) {
		handleSubmitError(error)

		if ((error as AuthError).code === 'otp_expired') {
			isFirstStep.value = true
			passcode.value = ''
		}
	}
}
</script>

<template>
	<h2 class="mb-2 text-lg font-medium">mit E-Mail-Adresse</h2>

	<form ref="formEl" novalidate @submit.prevent="onSubmit" data-test-form>
		<div>
			<template v-if="isFirstStep">
				<label for="email">E-Mail</label>
				<input v-model.trim="email" type="email" id="email" autocomplete="username" enterkeyhint="go" data-test-input />
			</template>

			<template v-else>
				<label for="code">Code</label>
				<input
					v-model.trim="passcode"
					type="text"
					id="code"
					inputmode="decimal"
					maxlength="6"
					pattern="\d{6,6}"
					autocomplete="one-time-code"
					enterkeyhint="go"
					data-test-input
				/>
			</template>
		</div>

		<button type="submit" :aria-disabled="isSubmitLocked" data-test-button>
			{{ isFirstStep ? 'Send password token' : 'Login' }}
		</button>
	</form>
</template>
