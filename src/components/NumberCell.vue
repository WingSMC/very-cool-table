<script setup lang="ts">
import { whenever } from '@vueuse/core';
import { computed, useTemplateRef } from 'vue';

const value = defineModel<number>({
	required: true,
});

const {
	editing,
	readonly,
	precision,
	defaultValue,
} = defineProps<{
	editing: boolean;
	precision: number;
	readonly: boolean;
	defaultValue: number;
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

const increment = computed(
	() => 10 ** -precision,
);

function onChange(event: Event) {
	const target = event.target as HTMLInputElement;
	const newValue = Number(target.value);
	if (!isNaN(newValue)) {
		value.value = parseFloat(
			newValue.toFixed(precision),
		);
	} else {
		value.value = defaultValue;
	}
}
</script>

<template>
	<input
		ref="input"
		type="number"
		:class="{ editing, readonly }"
		:readonly="!editing || readonly"
		:step="increment"
		:value
		@change="onChange"
	/>
</template>

<style scoped>
input {
	text-align: right;
}
</style>
