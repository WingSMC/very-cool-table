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
import { useContextMenu } from '../composables/use-context-menu';
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
 * Their order is the order in which the columns will be displayed.
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
		extraCtxMenuItems: () => [],
		columnToCellComponentTypeMap: () => ({}),
		overrideTypeToCellComponentTypeMap: () => ({
			[ColumnTypeEnum.Number]: NumberCell,
			[ColumnTypeEnum.String]:
				MultilineStringCell,
		}),
	},
);

const keyColumn = ref<symbol[]>(
	Array.from(
		{
			length: columns.value[0]
				? table.value[columns.value[0]].length ??
				  0
				: 0,
		},
		() => Symbol(),
	),
);

const isEmpty = computed(
	() => columns.value.length === 0,
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

const {
	ctxMenuTarget,
	ctxMenuItems,
	ctxMenuShow,
} = useContextMenu(
	useTemplateRef('menu'),
	props,
	sel,
	ops,
);

useTableEvents(
	props,
	sel,
	ops,
	ctxMenuTarget,
	useTemplateRef('tableContainer'),
);

defineExpose({
	/**
	 * The selection service used by the table.
	 * You can manipulate the selection / editing with this service.
	 *
	 * This is also provided through the `SELECTION_SERVICE` injection key to child components.
	 */
	selection: sel,
	/**
	 * The operations service used by the table.
	 * You can manipulate the table data with this service.
	 *
	 * This is also provided through the `OPERATIONS_SERVICE` injection key to child components.
	 */
	operations: ops,
	/**
	 * **props**:
	 * You can use this to access the props of the table including the defaulted values.
	 *
	 * **keyColumn**:
	 * The key column used to uniquely identify the rows of the table.
	 * This is the reason why the modification of the table outside the component is not recommended.
	 * If you need to modify the table, use the provided/exposed `OPERATIONS_SERVICE / operations` instead or keep this in sync with the table data.
	 *
	 * **isEmpty**:
	 * This computed is `true` if the table has no columns.
	 *
	 * **ctxMenuTarget**:
	 * Ref of the selected table column/cell for the context menu.
	 * Use this for your custom context menu items.
	 */
	internal: {
		props,
		keyColumn,
		isEmpty,
		ctxMenuTarget,
	},
});

provide(SELECTION_SERVICE, sel);
provide(OPERATIONS_SERVICE, ops);
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
					v-model="table[colName][row]"
					class="table-cell"
					:colName
					:col
					:row
					:class="{
						even: row % 2 === 0,
						selected: sel.isRowSelected(row),
					}"
					:key="keyColumn[row]"
					:is="
						columnToCellComponentTypeMap[
							colName
						] ??
						overrideTypeToCellComponentTypeMap[
							columnTypes[colName] ??
								defaultColumnType
						]
					"
					:editing="sel.isEditedCell(col, row)"
					:readonly="
						readonlyColumns.includes(colName)
					"
					:defaultValue="
						defaultColumnValues[colName] ??
						defaultColumnValue
					"
					:precision="
						columnPrecisions[colName] ??
						defaultColumnPrecision
					"
					@mousedown="
						sel.onMouseSelectionStart(
							col,
							row,
							$event,
						)
					"
					@mousemove="
						sel.onMouseSelectionMove(
							col,
							row,
							$event,
						)
					"
					@mouseup="
						sel.onMouseSelectionEnd(col, row)
					"
					@dblclick="
						editable &&
							sel.setEditedCell({ col, row })
					"
					@contextmenu="
						ctxMenuShow($event, colName, col, row)
					"
					@keydown.left.stop
					@keydown.right.stop
					@keydown.up.stop
					@keydown.down.stop
					@keydown.delete.stop
				/>
			</div>

			<div
				class="empty"
				v-if="isEmpty && allowAddCols && editable"
			>
				<button @click="ops.insertColumnAt(0)">
					<span class="pi pi-plus" />
					<span
						>The table is empty, add a
						column?</span
					>
				</button>
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
		@apply relative z-0 overflow-hidden;

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

.empty {
	@apply text-black grid place-items-center p-4;
	button {
		@apply flex items-center gap-2 p-2
			rounded-md
			shadow-md
			bg-gray-100 hover:bg-gray-200
			cursor-pointer;
	}
}
</style>
