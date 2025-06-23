import { inject, unref, type InjectionKey, type Ref } from 'vue'

// https://logaretm.com/blog/type-safe-provide-inject/
const injectStrict = <T>(key: InjectionKey<T>, fallback?: T) => {
	const resolved = inject(key, fallback)
	if (!resolved) throw new Error(`Could not resolve ${key.description}`)
	return resolved
}

const formatDate = (
	timestamp?: number | string,
	options: {
		time?: boolean
		month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow'
		day?: 'numeric' | '2-digit'
	} = { time: false },
): string => {
	if (!timestamp) return ''

	const format: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: options.month ?? '2-digit',
		day: options.day ?? '2-digit',
		...(options.time ? { hour: 'numeric', minute: 'numeric' } : {}),
	}

	const dateFormatted = new Date(timestamp).toLocaleDateString('de-DE', format)
	return options.time ? `${dateFormatted} Uhr` : dateFormatted
}

// const formatTime = (timestamp?: number) => (!!timestamp ? new Date(timestamp).toLocaleTimeString('de-DE') : '')

// const formatCount = (count: number, noun: [string, string]) => `${count} ${noun[count === 1 ? 0 : 1]}`

// available across browsers since March 2022
const createUuid = () => window.crypto.randomUUID()

/**
 * Checks if any of the provided arguments are empty.
 *
 * @param {...string|Ref<string>} args The arguments to check.
 * @returns {boolean} Returns true if any argument is empty, otherwise false.
 */
const isEmpty = (...args: (Ref<string> | string)[]): boolean => args.some(val => !unref(val).length)

export { injectStrict, formatDate, /* formatTime, */ /* formatCount, */ createUuid, isEmpty }
