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
	<input
		ref="input"
		type="text"
		v-model.lazy.trim="value"
		:readonly="!editing || readonly"
		:class="{ editing, readonly }"
	/>
</template>

<style scoped>
@reference '../../.storybook/style.css';

.editing {
	@apply shadow-md relative z-1 !border-b-4 !border-b-current;
}

.readonly {
	@apply cursor-not-allowed;
}
</style>
