<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue'
import HelloWorld from '../components/HelloWorld.vue'
import { useStore } from '@/use/store'

const { state, realtimeSubscribe, realtimeUnsubscribe, fetchEntries } = useStore()
realtimeSubscribe()

watch(
	() => state.subscribed,
	subscribed => {
		if (subscribed) fetchEntries()
	},
)

onBeforeUnmount(() => {
	realtimeUnsubscribe()
})
</script>

<template>
	<main>
		Hello world!
		<HelloWorld msg="You did it!" />
	</main>
</template>
