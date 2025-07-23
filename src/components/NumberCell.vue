<script setup lang="ts">
import { whenever } from '@vueuse/core';
import { computed, useTemplateRef } from 'vue';
import {
	calcUpscale,
	roundToPrecision,
} from '../util';

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
	defaultValue: unknown;
}>();

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

const increment = computed(
	() => 10 ** -precision,
);
const upscale = computed(() =>
	calcUpscale(precision),
);

function onChange(event: Event) {
	const target = event.target as HTMLInputElement;
	value.value = roundToPrecision(
		target.value,
		upscale.value,
		Number(defaultValue),
	);
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
	text-align: center;
}
</style>
