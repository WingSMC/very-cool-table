<script setup lang="ts">
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
import MultilineStringCell from './MultilineStringCell.vue';
import NumberCell from './NumberCell.vue';

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
		verticalHeader: false,
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
		columnToCellComponentTypeMap: () => ({}),
		overrideTypeToCellComponentTypeMap:
			() => ({}),
	},
);

const typeToComponentMap = computed<
	Record<number, any>
>(() => ({
	[ColumnTypeEnum.Number]: NumberCell,
	[ColumnTypeEnum.String]: MultilineStringCell,
	...props.overrideTypeToCellComponentTypeMap,
}));

const firstColumnLength = computed(
	() =>
		table.value[columns.value[0]]?.length ?? 0,
);

const keyColumn = ref<symbol[]>(
	Array.from(
		{ length: firstColumnLength.value },
		() => Symbol(),
	),
);

const ctxMenuTarget = ref<
	| {
			colName: string;
			col: number;
			row?: number;
	  }
	| undefined
>(undefined);

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
	ctxMenuTarget,
	useTemplateRef('tableContainer'),
);

defineExpose({
	selection: sel,
	operations: ops,
	/**
	 * The keyColumn is internally used to uniquely identify the rows of the table.
	 *
	 * This is the reason why the modification of the table outside the component is not recommended.
	 * If you need to modify the table, use the provided operations instead or keep this in sync with the table data.
	 *
	 * This is a getter to the ref because the ref would be unwrapped by Vue.
	 */
	getKeyColumn: () => keyColumn,
	ctxMenuTarget,
	props,
});

provide(SELECTION_SERVICE, sel);
provide(OPERATIONS_SERVICE, ops);

const menu = useTemplateRef('menu');
const ctxTargetReadonly = computed(() => {
	return (
		ctxMenuTarget.value &&
		props.readonlyColumns.includes(
			ctxMenuTarget.value.colName,
		)
	);
});
const ctxColEditItems = computed(() =>
	props.allowAddCols
		? [
				{
					label: 'Move Column Right',
					icon: 'pi pi-arrow-right',
					kbd: ['Alt', '→'],
					command: () => {
						const t = ctxMenuTarget.value!;
						if (t.row) {
							sel.selectCell(t.col, t.row);
						} else {
							sel.selectColumn(t.col);
						}

						ops.moveSelCol(1);
					},
				},
				{
					label: 'Move Column Left',
					icon: 'pi pi-arrow-left',
					kbd: ['Alt', '←'],
					command: () => {
						const t = ctxMenuTarget.value!;
						if (t.row) {
							sel.selectCell(t.col, t.row);
						} else {
							sel.selectColumn(t.col);
						}

						ops.moveSelCol(-1);
					},
				},
				{
					label: 'Insert Column',
					icon: 'pi pi-plus',
					kbd: ['Ctrl', 'Shift', 'Enter'],
					command: () => {
						const t = ctxMenuTarget.value!;
						if (t.row) {
							sel.selectCell(t.col, t.row);
						} else {
							sel.selectColumn(t.col);
						}

						ops.insertColumn();
					},
				},
				{
					label: 'Delete Column',
					icon: 'pi pi-trash',
					kbd: ['Ctrl', 'Shift', 'Delete'],
					disabled: ctxTargetReadonly.value,
					command: () => {
						const t = ctxMenuTarget.value!;
						if (t.row) {
							sel.selectCell(t.col, t.row);
						} else {
							sel.selectColumn(t.col);
						}

						ops.deleteColumns();
					},
				},
				{
					label: 'Rename Column',
					icon: 'pi pi-pencil',
					kbd: ['Alt', 'R'],
					disabled: ctxTargetReadonly.value,
					command: () => {
						const t = ctxMenuTarget.value!;
						if (t.row) {
							sel.selectCell(t.col, t.row);
							ops.renameSelCol();
						} else {
							ops.renameCol(
								ctxMenuTarget.value!.col,
							);
						}
					},
				},
		  ]
		: [],
);
const ctxRowEditItems = computed(() =>
	props.allowAddRows
		? [
				{
					label: 'Insert Row',
					icon: 'pi pi-plus',
					kbd: ['Ctrl', 'Enter'],
					command: () => {
						const t = ctxMenuTarget.value!;
						if (t.row) {
							ops.insertRowAt(t.row + 1);
						} else {
							ops.pushRow();
						}
					},
				},
				{
					label: 'Delete Row',
					icon: 'pi pi-trash',
					kbd: ['Ctrl', 'Delete'],
					command: () => {
						const t = ctxMenuTarget.value!;
						if (t.row) {
							sel.selectCell(t.col, t.row);
						} else {
							sel.selectColumn(t.col);
						}

						ops.deleteRows();
					},
				},
		  ]
		: [],
);
const ctxEditableItems = computed(() =>
	props.editable
		? [
				...ctxColEditItems.value,
				...ctxRowEditItems.value,
		  ]
		: [],
);
const ctxMenuItems = computed(() => {
	return [
		...props.extraHeaderMenuItems,
		...ctxEditableItems.value,
	];
});
function ctxMenuShow(
	event: MouseEvent,
	colName: string,
	col: number,
	row?: number,
) {
	if (ctxMenuItems.value.length === 0) return;

	ctxMenuTarget.value = {
		colName,
		col,
		row,
	};
	menu.value?.show(event);
}
</script>

<template>
	<div
		class="table"
		:class="{ editable }"
		ref="tableContainer"
	>
		<ContextMenu
			ref="menu"
			class="vct-context-menu"
			:model="ctxMenuItems"
			@hide="ctxMenuTarget = undefined"
		>
			<template #item="{ item, props }">
				<div
					class="ctx-row"
					v-bind="props.action"
				>
					<span :class="item.icon" />
					<span class="ctx-label">{{
						item.label
					}}</span>
					<span
						v-if="item.kbd"
						class="ctx-kbd"
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

		<div class="table-header">
			<div
				v-for="(colName, col) in columns"
				class="table-header-cell table-cell"
				aria-haspopup="true"
				:key="colName"
				:class="{
					even: col % 2 === 0,
					vertical: verticalHeader,
				}"
				:style="{
					'--color-vct-cell-inherit':
						columnColors[colName] ??
						defaultColumnColor,
				}"
				@click="sel.selectColumn(col)"
				@contextmenu="
					ctxMenuShow($event, colName, col)
				"
			>
				<span>{{ colName }}</span>
			</div>
		</div>

		<div
			class="table-body"
			:style="`grid-template-rows: repeat(${keyColumn.length},max-content)`"
		>
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
						columnToCellComponentTypeMap[
							colName
						] ??
						typeToComponentMap[
							columnTypes[colName] ??
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
						readonlyColumns.includes(colName)
					"
					:modelValue="table[colName][row]"
					:defaultValue="
						defaultColumnValues[colName] ??
						defaultColumnValue
					"
					:precision="
						columnPrecisions[colName] ??
						defaultColumnPrecision
					"
					@update:modelValue="
						table[colName][row] = $event
					"
					@mousedown="
						sel.onSelectionStart(col, row, $event)
					"
					@mousemove="
						sel.onSelectionMove(col, row, $event)
					"
					@mouseup="sel.onSelectionEnd(col, row)"
					@dblclick="
						editable &&
							sel.setEditedCell({ col, row })
					"
					@contextmenu="
						ctxMenuShow($event, colName, col, row)
					"
				/>
			</div>
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

.vct-context-menu {
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
	@apply shadow-lg rounded-lg relative z-1 w-full select-none;

	.table-header,
	.table-body {
		@apply grid grid-cols-[repeat(auto-fit,minmax(0,1fr))];
	}
	.table-header {
		@apply z-10 h-full sticky top-0;
	}
	.table-body {
		@apply relative z-0 overflow-hidden grid-rows-[repeat(3,max-content)];

		.table-column {
			@apply grid grid-rows-subgrid row-span-full;

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
	}
}

.table-cell {
	@apply min-h-vct-cell-height
		p-1
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
		
		w-full outline-none shadow-black/30
		cursor-default;

	&.editing {
		@apply shadow-md relative z-1 !border-b-3 !border-b-current;
	}
}

.table.editable {
	.table-cell.readonly {
		@apply cursor-not-allowed;
	}
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
	@apply p-4
		h-full
		leading-normal
		border-b-4 border-b-vct-cell-inherit
		text-shadow-vct
		first:rounded-tl-lg last:rounded-tr-lg
		flex gap-4 justify-center items-center;

	&.vertical {
		@apply [writing-mode:vertical-lr] justify-end;
	}
}

.ctx-row {
	@apply col-span-3 !grid grid-cols-subgrid !gap-4  items-center;
}
.ctx-kbd {
	@apply flex items-center gap-1;
	kbd {
		@apply inline-block px-1.5 py-0.5 text-xs font-mono border rounded;
	}
}
.ctx-label {
	@apply whitespace-nowrap;
}
</style>
