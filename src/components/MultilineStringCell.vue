<script setup lang="ts">
import { whenever } from '@vueuse/core';
import { useTemplateRef } from 'vue';

const value = defineModel<string>({
	required: true,
});

const { editing, readonly } = defineProps<{
	editing: boolean;
	readonly?: boolean;
}>();

const inputRef =
	useTemplateRef<HTMLInputElement>('input');

whenever(
	() => !readonly && editing,
	() => {
		const el = inputRef.value!;
		el.focus();
		el.select();
	},
	{ flush: 'post' },
);
</script>

<template>
	<textarea
		ref="input"
		v-model.lazy.trim="value"
		:readonly="!editing || readonly"
		:class="{ editing, readonly }"
		@keydown.enter.stop
	></textarea>
</template>

<style scoped>
textarea {
	field-sizing: content;
	resize: none;
}
</style>
