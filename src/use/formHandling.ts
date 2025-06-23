import { ref } from 'vue'

export const useFormHandling = () => {
	// const errorCode = ref<number | null>(null)
	// const errorMessage = ref('')
	const isSubmitLocked = ref(false)
	const unlockSubmit = () => {
		isSubmitLocked.value = false
	}

	const beforeSubmit = () => {
		isSubmitLocked.value = true
		// errorCode.value = null
	}

	const handleSubmitError = (error: unknown) => {
		// 🔺 TODO error handling
		console.error(error)
		unlockSubmit()
	}

	return {
		// errorCode,
		// errorMessage,
		isSubmitLocked,
		unlockSubmit,
		beforeSubmit,
		handleSubmitError,
	}
}
