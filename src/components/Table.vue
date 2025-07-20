<script
	setup
	lang="ts"
	generic="T extends Record<string, any[]>"
>
import { ContextMenu } from 'primevue';
import {
	computed,
	provide,
	ref,
	useTemplateRef,
} from 'vue';
import { useTableEvents } from '../composables/table-event-bindings';
import { useTableOps } from '../composables/table-ops';
import { useTableSelection } from '../composables/table-selection';
import {
	ColumnTypeEnum,
	type InputProps,
} from '../types';
import {
	OPERATIONS_SERVICE,
	SELECTION_SERVICE,
} from '../util';
import StringCell from './StringCell.vue';

/**
 * The data to display in the table.
 * Should be an object with keys as column names and values as arrays of column data.
 * You should not alter this object directly, but rather use the exposed operations to modify it.
 */
const table = defineModel<Record<string, any[]>>({
	required: true,
});

/**
 * The columns to display in the table.
 * Should be an array of column names.
 * Their order is the order in which they will be displayed.
 */
const columns = defineModel<string[]>('columns', {
	required: true,
});

const props = withDefaults(
	defineProps<InputProps>(),
	{
		editable: true,
		allowAddCols: true,
		allowAddRows: true,
		defaultColumnValue: '',
		defaultColumnType: ColumnTypeEnum.String,
		defaultColumnPrecision: 2,
		defaultColumnColor: '#000000',
		readonlyColumns: () => [],
		columnColors: () => ({}),
		defaultColumnValues: () => ({}),
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

const firstColumnLength = computed(
	() =>
		table.value[columns.value[0]]?.length ?? 0,
);

const keyColumn = ref<symbol[]>(
	Array.from(
		{ length: firstColumnLength.value },
		() => Symbol('vct-row-key'),
	),
);

const sel = useTableSelection(
	columns,
	props,
	keyColumn,
);
const ops = useTableOps(
	table,
	columns,
	props,
	sel,
	keyColumn,
);
useTableEvents(
	props,
	sel,
	ops,
	useTemplateRef('tableContainer'),
);

defineExpose({
	selection: sel,
	operations: ops,
	keyColumn,
});

provide(SELECTION_SERVICE, sel);
provide(OPERATIONS_SERVICE, ops);

const menu = ref();
const ctxMenuCol = ref<
	| {
			name: string;
			index: number;
	  }
	| undefined
>(undefined);

const editableMenuItems = computed(() =>
	props.editable && props.allowAddCols
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

const ctxHeaderItem = computed(() => {
	return [
		...props.extraHeaderMenuItems,
		...editableMenuItems.value,
	];
});

function ctxHeaderShow(
	event: MouseEvent,
	colName: string,
	colIndex: number,
) {
	if (ctxHeaderItem.value.length === 0) return;

	ctxMenuCol.value = {
		name: colName,
		index: colIndex,
	};
	menu.value.show(event);
}
</script>

<template>
	<div class="select-none">
		<div
			class="table"
			ref="tableContainer"
		>
			<div class="table-header">
				<ContextMenu
					ref="menu"
					class="context-menu"
					:model="ctxHeaderItem"
					@hide="ctxMenuCol = undefined"
				>
					<template #item="{ item, props }">
						<div
							class="context-menu-row"
							v-bind="props.action"
						>
							<span :class="item.icon" />
							<span class="whitespace-nowrap">{{
								item.label
							}}</span>
							<span
								v-if="item.kbd"
								class="kbd-cell"
							>
								<kbd
									v-for="key in item.kbd"
									:key="key"
									>{{ key }}</kbd
								>
							</span>
						</div>
					</template>
				</ContextMenu>

				<div
					v-for="(col, i) in columns"
					class="table-header-cell table-cell"
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
						ctxHeaderShow($event, col, i)
					"
				>
					<span class="header-title">{{
						col
					}}</span>
				</div>
			</div>

			<div class="table-body">
				<div
					class="table-column"
					v-for="(colName, col) in columns"
					:key="colName"
					:class="{
						selected: sel.isColumnSelected(col),
						even: col % 2 === 0,
					}"
					:style="{
						'--color-vct-cell-inherit':
							columnColors[colName] ??
							defaultColumnColor,
					}"
				>
					<Component
						v-for="(_, row) in table[colName]"
						class="table-cell"
						:is="
							typeToComponentMap[
								props.columnTypes[colName] ??
									defaultColumnType
							]
						"
						:class="{
							even: row % 2 === 0,
							selected: sel.isRowSelected(row),
						}"
						:key="keyColumn[row]"
						:editing="sel.isEditedCell(col, row)"
						:readonly="
							!editable ||
							readonlyColumns.includes(colName)
						"
						v-model.lazy="table[colName][row]"
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
			class="table-actions"
		>
			<button
				v-if="allowAddRows"
				class="table-action-button"
				type="button"
				@click="ops.pushRow"
				>+Row</button
			>

			<button
				v-if="allowAddCols"
				class="table-action-button"
				type="button"
				@click="ops.pushColumn"
				>+Col</button
			>
		</div>
	</div>
</template>

<style>
@reference '../../.storybook/style.css';
:root {
	--color-vct-cell-inherit: black;
	--spacing-vct-cell-height: 40px;
	--text-shadow-vct: 0 0 2rem
		var(--color-vct-cell-inherit);
	--inset-shadow-vct: inset 0px 0px 3rem 0rem
		var(--tw-inset-shadow-color);
}

.context-menu {
	.p-contextmenu-root-list,
	.p-contextmenu-item,
	.p-contextmenu-item-content {
		@apply !grid;
	}

	.p-contextmenu-root-list {
		@apply grid-cols-[min-content_min-content_min-content];
	}

	.p-contextmenu-item,
	.p-contextmenu-item-content {
		@apply col-span-3 grid-cols-subgrid;
	}
}
</style>

<style scoped>
@reference '../../.storybook/style.css';

.table {
	@apply shadow-lg rounded-lg relative z-1 w-full;
}

.table-header,
.table-body {
	@apply grid grid-rows-1 grid-cols-[repeat(auto-fit,minmax(0,1fr))];
}
.table-header {
	@apply z-10 h-full sticky top-0;
}
.table-body {
	@apply relative z-0 overflow-hidden;
}

.table-column {
	&:first-child {
		.table-cell {
			@apply last:rounded-bl-lg;
		}
	}
	&:last-child {
		.table-cell {
			@apply last:rounded-br-lg;
		}
	}
}

.table-cell {
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
		[.selected>.selected]:inset-shadow-blue-300/20
		
		w-full outline-none shadow-black/30;
}
input.table-cell {
	appearance: textfield;
	&::-webkit-outer-spin-button,
	&::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
}
.table-header-cell {
	@apply py-2 px-1
		h-full
		leading-normal
		[writing-mode:vertical-lr]
		border-b-4 border-b-vct-cell-inherit
		text-shadow-vct
		first:rounded-tl-lg last:rounded-tr-lg
		flex gap-4 flex-row-reverse justify-between items-center;
}
.header-title {
	@apply select-none;
}

.table-actions {
	@apply relative -top-1 z-0;
}

.table-action-button {
	@apply absolute rounded-b-md h-9 w-20 px-4 py-1.5 text-white font-extrabold hover:bg-blue-600 cursor-pointer bg-blue-500;
	&:nth-child(2) {
		left: 5.5rem;
	}
}

.context-menu-row {
	@apply col-span-3 !grid grid-cols-subgrid !gap-4  items-center;

	kbd {
		@apply inline-block px-1.5 py-0.5 text-xs font-mono border rounded;
	}
}

.kbd-cell {
	@apply flex items-center gap-1;
}

.whitespace-nowrap {
	@apply whitespace-nowrap;
}
.select-none {
	@apply select-none;
}
</style>
