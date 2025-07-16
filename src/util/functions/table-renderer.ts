import { computed, type Ref } from 'vue';
import {
	getRootCSSProperyValue,
	range,
} from './util';

export function useTableRenderer(
	lastTableRowIndex: Ref<number>,
	ROW_HEIGHT_PX = getRootCSSProperyValue(
		'--spacing-vct-cell-height',
	),
) {
	const tableHeight = computed(
		() =>
			(lastTableRowIndex.value + 1) *
			ROW_HEIGHT_PX,
	);

	const firstCellTopOffset = computed(
		() =>
			displayedCellRange.value[0] * ROW_HEIGHT_PX,
	);

	const displayedCellRange = computed(
		() =>
			[
				0 as number,
				lastTableRowIndex.value,
			] as const,
	);

	const cellIterator = computed(() =>
		range(...displayedCellRange.value),
	);

	return {
		tableHeight,
		firstCellTopOffset,
		cellIterator,
	};
}
