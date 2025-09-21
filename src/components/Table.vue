<script setup lang="ts">
import { ContextMenu } from 'primevue';
import {
	computed,
	provide,
	reactive,
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
	KEY_COLUMN,
	OPERATIONS_SERVICE,
	SELECTION_SERVICE,
	sortByArrayOrder,
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
const hiddenColumns = reactive(new Set<string>());
const displayedColumns = computed(() =>
	columns.value
		.filter(col => !hiddenColumns.has(col))
		.sort(sortByArrayOrder(columns.value)),
);

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

function findLen() {
	const min = Math.min(
		...columns.value
			.map(c => table.value[c]?.length)
			.filter(l => l > 0),
	);
	return min === Infinity ? 0 : min;
}

const keyColumn = ref<symbol[]>(
	Array.from({ length: findLen() }, () =>
		Symbol(),
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
	 * The `keyColumn` used to uniquely identify the rows of the table. It is just a simple Ref<symbol[]>.
	 * This is the reason why the modification of the table outside the component is not recommended.
	 * This is provided with the `KEY_COLUMN` injection key to child components.
	 * If you need to modify the table, use the provided/exposed `OPERATIONS_SERVICE / operations` instead
	 * *OR if you really want to touch it yourself when you add/remove a row make sure to also add/remove the key symbol at the right index in this array.*
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
provide(KEY_COLUMN, keyColumn);
</script>

<template>
	<div
		class="vct"
		:class="{ editable }"
		:style="{
			'--vct-n-rows': keyColumn.length + 1,
			'--vct-n-cols': displayedColumns.length,
		}"
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

		<div class="vct-body">
			<div
				class="vct-column"
				v-for="(colName, col) in displayedColumns"
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
				<div
					class="vct-header-cell"
					aria-haspopup="true"
					:key="colName"
					:class="{ vertical: verticalHeader }"
					@click="sel.selectColumn(col)"
					@contextmenu="
						ctxMenuShow($event, colName, col)
					"
				>
					<span>{{ colName }}</span>
				</div>

				<Component
					class="vct-cell"
					v-for="(val, row) in table[colName] ??
					keyColumn"
					:key="keyColumn[row]"
					:keySymbol="keyColumn[row]"
					:colName
					:col
					:row
					:class="{
						even: row % 2 === 0,
						selected: sel.isRowSelected(row),
					}"
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
					:modelValue="val"
					@update:modelValue="
						table[colName][row] = $event!
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

@property --vct-n-rows {
	syntax: '<integer>';
	initial-value: 0;
	inherits: false;
}

@property --vct-n-cols {
	syntax: '<integer>';
	initial-value: 0;
	inherits: false;
}

:root {
	--color-vct-cell-inherit: black;
	--inset-shadow-vct: inset 0px 0px 3rem 0rem
		var(--tw-inset-shadow-color);

	--spacing-vct-cell-height: 40px;
	--spacing-vct-col-min: 40px;
	--spacing-vct-col-max: unset;
	--spacing-vct-col: max-content;
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

.vct {
	@apply shadow-lg rounded-lg relative z-1 w-full overflow-x-auto select-none;

	.vct-body {
		@apply grid relative z-0 @container;

		grid-template-rows: repeat(
			var(--vct-n-rows),
			max-content
		);
		grid-template-columns: repeat(
			var(--vct-n-cols),
			max-content
		);

		.vct-column {
			@apply grid grid-rows-subgrid row-span-full;

			&:first-child > * {
				@apply first:rounded-tl-lg last:rounded-bl-lg;
			}
			&:last-child > * {
				@apply first:rounded-tr-lg last:rounded-br-lg;
			}
		}
	}

	&.editable {
		.vct-cell.readonly {
			@apply cursor-not-allowed;
		}
	}
}

.vct-header-cell {
	@apply p-4
		h-full
		leading-normal
		border-b-4 border-b-vct-cell-inherit

		flex gap-4 justify-center items-center

		z-10 sticky top-0;

	&.vertical {
		@apply [writing-mode:vertical-lr] justify-end;
	}

	span {
		@apply break-all;
	}
}

.vct-cell,
.vct-header-cell {
	@apply w-vct-col min-w-vct-col-min max-w-vct-col-max;
	@apply outline-none
		w-full
		bg-clip-border
		bg-white
		text-vct-cell-inherit
		cursor-default 
		[.even,.even>*]:bg-gray-50
		[.even>.even]:bg-gray-100;
}

.vct-cell {
	@apply p-1
		min-h-vct-cell-height
		border
		border-transparent

		[.selected>.selected]:border-blue-500
		[.selected+.selected>.selected]:border-l-transparent
		[.selected:has(+.selected)>.selected]:border-r-transparent
		[.selected+.selected]:!border-t-transparent
		has-[+.selected]:!border-b-transparent
		[.selected>.selected]:inset-shadow-vct
		[.selected>.selected]:inset-shadow-blue-300/20;

	&.editing {
		@apply shadow-md relative z-1 !border-b-3 !border-b-current;
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
