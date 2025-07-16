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
	() => editing,
	() => {
		const el = inputRef.value!;
		el.focus();
		el.select();
	},
);
</script>

<template>
	<input
		ref="input"
		class="size-full outline-none shadow-black/30"
		type="text"
		v-model.lazy.trim="value"
		:readonly="!editing || readonly"
		:class="{
			'shadow-md relative z-1': editing,
		}"
	/>
</template>
