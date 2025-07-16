<script setup lang="ts" generic="T extends {}">
import {
	computed,
	provide,
	ref,
	useTemplateRef,
} from 'vue';
import type { InputProps } from '../types';
import {
	ColumnTypeEnum,
	SELECTION_SERVICE,
	useTableOps,
	useTableSelection,
	type ColumnKey,
	type SomeColumn,
} from '../util';
import { useTableEvents } from '../util/functions/table-event-bindings';
import StringCell from './StringCell.vue';

const table = defineModel<T>({ required: true });
const columns = defineModel<ColumnKey<T>[]>(
	'columns',
	{ required: true },
);

const props = withDefaults(
	defineProps<InputProps<T>>(),
	{
		allowAddCols: true,
		allowAddRows: true,
		editable: true,
		defaultColumnColor: '#000000',
		readonlyColumns: () => [],
		columnColors: () => ({}),
		defaultValues: () => ({}),
		columnTypes: () => ({}),
		columnPrecisions: () => ({}),
		extraHeaderMenuItems: () => [],
		overrideTypeToCellComponentTypeMap:
			() => ({}),
	},
);

const typeToComponentMap = computed<
	Record<number, any>
>(() => ({
	[ColumnTypeEnum.Number]: StringCell,
	[ColumnTypeEnum.String]: StringCell,
	[ColumnTypeEnum.Boolean]: StringCell,
	...props.overrideTypeToCellComponentTypeMap,
}));

const sel = useTableSelection(
	columns,
	props,
	computed(() => {
		return table.value[
			props.keyColumn
		] as SomeColumn;
	}),
);
const ops = useTableOps(
	table,
	columns,
	props,
	sel,
);
useTableEvents(
	props,
	sel,
	ops,
	useTemplateRef('tableContainer'),
);

provide(SELECTION_SERVICE, sel);

const menu = ref();
const ctxMenuCol = ref<
	| {
			name: string;
			index: number;
	  }
	| undefined
>(undefined);

const editableMenuItems = computed(() =>
	props.editable
		? [
				{
					label: 'Move Right',
					icon: 'pi pi-arrow-right',
					kbd: ['Alt', '→'],
					command: () => {
						sel.selectColumn(
							ctxMenuCol.value!.index,
						);
						ops.moveSelCol(1);
					},
				},
				{
					label: 'Move Left',
					icon: 'pi pi-arrow-left',
					kbd: ['Alt', '←'],
					command: () => {
						sel.selectColumn(
							ctxMenuCol.value!.index,
						);
						ops.moveSelCol(-1);
					},
				},
		  ]
		: [],
);

const menuItems = computed(() => {
	return [
		...props.extraHeaderMenuItems,
		...editableMenuItems.value,
	];
});

function showHeaderCtxMenu(
	event: MouseEvent,
	colName: string,
	colIndex: number,
) {
	if (menuItems.value.length === 0) return;

	ctxMenuCol.value = {
		name: colName,
		index: colIndex,
	};
	menu.value.show(event);
}
</script>

<template>
	<div>
		<div
			class="shadow-lg rounded-lg relative z-1"
			ref="tableContainer"
		>
			<div class="bclg-table-header">
				<!-- prettier-ignore -->
				<ContextMenu
					ref="menu"
					class="
					[&_.p-contextmenu-root-list]:!grid
					[&_.p-contextmenu-root-list]:grid-cols-[min-content_min-content_min-content]
					[&_.p-contextmenu-item]:col-span-3
					[&_.p-contextmenu-item]:!grid
					[&_.p-contextmenu-item]:grid-cols-subgrid
					[&_.p-contextmenu-item-content]:col-span-3
					[&_.p-contextmenu-item-content]:grid
					[&_.p-contextmenu-item-content]:grid-cols-subgrid
					"
					:model="menuItems"
					@hide="ctxMenuCol = undefined"
				>
					<template #item="{ item, props }">
						<div
							class="col-span-3 !grid grid-cols-subgrid !gap-4  items-center"
							v-bind="props.action"
						>
							<span :class="item.icon" />
							<span class="whitespace-nowrap">{{
								item.label
							}}</span>
							<span
								v-if="item.kbd"
								class="flex items-center gap-1"
							>
								<kbd
									v-for="key in item.kbd"
									class="inline-block px-1.5 py-0.5 text-xs font-mono border rounded"
									:key="key"
									>{{ key }}</kbd
								>
							</span>
						</div>
					</template>
				</ContextMenu>

				<div
					v-for="(col, i) in columns"
					class="bclg-table-header-cell bclg-table-cell flex gap-4 flex-row-reverse justify-between items-center"
					aria-haspopup="true"
					:key="col"
					:class="{ even: i % 2 === 0 }"
					:style="{
						'--color-vct-cell-inherit':
							columnColors[col] ??
							defaultColumnColor,
					}"
					@click="sel.selectColumn(i)"
					@contextmenu="
						showHeaderCtxMenu($event, col, i)
					"
				>
					<span
						class="header-title select-none after:rotate-90"
						>{{ col }}</span
					>
				</div>
			</div>

			<div
				class="bclg-table-body overflow-hidden"
			>
				<div
					class="bclg-table-column relative"
					v-for="(colName, col) in columns"
					:key="colName"
					:class="{
						selected: sel.isColumnSelected(col),
						even: col % 2 === 0,
						'cursor-not-allowed':
							readonlyColumns.includes(colName),
					}"
					:style="{
						'--color-vct-cell-inherit':
							columnColors[colName] ??
							defaultColumnColor,
					}"
				>
					<Component
						v-for="(_, row) in table[colName] as SomeColumn"
						class="bclg-table-cell select-none"
						:is="
							typeToComponentMap[
								props.columnTypes[colName] ??
									ColumnTypeEnum.String
							]
						"
						:class="{
							even: row % 2 === 0,
							selected: sel.isRowSelected(row),
						}"
						:key="row"
						:editing="sel.isEditedCell(col, row)"
						:readonly="
							readonlyColumns.includes(colName) ||
							!editable
						"
						v-model.lazy="(table[colName] as SomeColumn)[row]"
						@mousedown="
							sel.onSelectionStart(
								col,
								row,
								$event,
							)
						"
						@mousemove="
							sel.onSelectionMove(
								col,
								row,
								$event,
							)
						"
						@mouseup="
							sel.onSelectionEnd(col, row)
						"
						@dblclick="
							editable &&
								sel.setEditedCell({ col, row })
						"
					/>
				</div>
			</div>
		</div>

		<div
			v-if="editable"
			class="relative -top-1 z-0"
		>
			<button
				v-if="allowAddRows"
				class="absolute rounded-b-md h-9 w-20 px-4 py-1.5 text-white font-extrabold hover:bg-blue-600 cursor-pointer bg-blue-500"
				type="button"
				@click="ops.pushRow"
				>+Row</button
			>

			<button
				v-if="allowAddCols"
				class="absolute rounded-b-md h-9 w-20 px-4 py-1.5 text-white font-extrabold hover:bg-blue-600 cursor-pointer bg-blue-500 left-24"
				type="button"
				@click="ops.pushColumn"
				>+Col</button
			>
		</div>
	</div>
</template>

<style>
:root {
	--color-vct-cell-inherit: black;
	--spacing-vct-cell-height: 40px;
	--text-shadow-vct: 0 0 2rem
		var(--color-vct-cell-inherit);
	--inset-shadow-vct: inset 0px 0px 3rem 0rem
		var(--tw-inset-shadow-color);
}
</style>

<style scoped>
@reference '../../.storybook/style.css';

@theme {
	--color-vct-cell-inherit: black;
	--spacing-vct-cell-height: 40px;
	--text-shadow-vct: 0 0 2rem
		var(--color-vct-cell-inherit);

	--inset-shadow-vct: inset 0px 0px 3rem 0rem
		var(--tw-inset-shadow-color);
}

.bclg-table-header,
.bclg-table-body {
	@apply grid grid-rows-1 grid-cols-[repeat(auto-fit,minmax(0,1fr))];
}
.bclg-table-header {
	@apply z-10 h-full sticky top-0;
}
.bclg-table-body {
	@apply relative z-0;
}

.bclg-table-column {
	&:first-child {
		.bclg-table-cell {
			@apply last:rounded-bl-lg;
		}
	}
	&:last-child {
		.bclg-table-cell {
			@apply last:rounded-br-lg;
		}
	}
}

.bclg-table-cell {
	@apply h-vct-cell-height
		leading-vct-cell-height
		text-center
		border
		border-transparent
		bg-clip-border

		text-vct-cell-inherit

		bg-white
		[.even,.even>*]:bg-gray-50
		[.even>.even]:bg-gray-100

		[.selected>.selected]:border-blue-500
		[.selected+.selected>.selected]:border-l-transparent
		[.selected:has(+.selected)>.selected]:border-r-transparent
		[.selected+.selected]:!border-t-transparent
		has-[+.selected]:!border-b-transparent
		[.selected>.selected]:inset-shadow-vct
		[.selected>.selected]:inset-shadow-blue-300/20;

	.exclamation {
		@apply text-orange-500 bg-orange-500/10 [.even]:bg-orange-500/20;

		mat-form-field {
			@apply relative;

			&::after {
				@apply absolute right-1 top-1/2 -translate-y-1/2;
			}
		}
		.cell-label::after,
		mat-form-field::after {
			@apply content-['!'] font-bold;
		}
	}

	.cell-label {
		@apply select-none;
	}
}
.bclg-table-header-cell {
	@apply py-2 px-1
		h-full
		leading-normal
		[writing-mode:vertical-lr]
		border-b-4
		border-b-vct-cell-inherit
		text-shadow-vct
		[&.highlight>.header-title]:before:content-['@']
		first:rounded-tl-lg
		last:rounded-tr-lg;
}

.table-cell-input {
	width: 100%;
	text-align: center;

	input {
		appearance: textfield;
		color: inherit;

		&::-webkit-outer-spin-button,
		&::-webkit-inner-spin-button {
			-webkit-appearance: none;
			margin: 0;
		}
	}
}
</style>
