<script setup lang="ts">
import { whenever } from '@vueuse/core';
import { useTemplateRef } from 'vue';
import type { CellProps } from '../types';

const value = defineModel<string>({
	required: true,
});

const { editing, readonly } =
	defineProps<CellProps<unknown>>();

const inputRef = useTemplateRef('input');

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
		@keydown.enter.exact.stop
	></textarea>
</template>

<style scoped>
textarea {
	field-sizing: content;
	resize: none;
}
</style>
