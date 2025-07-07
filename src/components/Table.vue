<script setup lang="ts" generic="T extends {}">
type Column = Exclude<keyof T, symbol>;
type ColumnMap<V> = Record<Column, V>;
type PartialColumnMap<V> = Partial<ColumnMap<V>>;

const data = defineModel<T>({ required: true });
const {
	allowAddCols = false,
	allowAddRows = false,
	editable = true,

	columns,
	keyColumn,
	readonlyColumns = [],
	defaultValues = {} as PartialColumnMap<
		T[Column]
	>,
	columnColors = {} as PartialColumnMap<string>,
	defaultColumnColor = '#777777',
} = defineProps<{
	allowAddRows: boolean;
	allowAddCols: boolean;
	editable: boolean;

	columns: Column[];
	keyColumn?: Column;
	readonlyColumns?: Column[];
	defaultValues?: PartialColumnMap<T[Column]>;
	columnColors?: PartialColumnMap<string>;
	defaultColumnColor: string;
	// columnTypes: Record<Column, Type<Component fitting interface>>
}>();

function selectColumn(_i: number) {}
function isColumnSelected(_i: number) {
	return true;
}
function isRowSelected(
	_col: string | number,
	_row: number,
) {
	return _row > 0;
}
</script>

<template>
	<div
		class="grid grid-rows-[var(--table-header-height)_1fr] shadow-lg rounded-lg relative z-1"
	>
		<!-- 		<slot name="context-menu">HI</slot> -->
		<div class="bclg-table-header">
			<div
				class="bclg-table-header-cell bclg-table-cell flex gap-4 flex-row-reverse justify-between items-center"
				v-for="(col, i) in columns"
				:key="col"
				:class="{ even: i % 2 === 0 }"
				:style="{
					'--color-cell-inherit':
						columnColors[col] ??
						defaultColumnColor,
				}"
				@click="selectColumn(i)"
			>
				<span class="header-title select-none">{{
					col
				}}</span>
				<!-- 				@if ($headerTemplate(); as headerTemplate)
				{
				<ng-container
					[ngTemplateOutlet]="headerTemplate"
					[ngTemplateOutletContext]="{ $implicit: colName, column }"
				></ng-container>
				} -->
			</div>
		</div>

		<div class="bclg-table-body overflow-hidden">
			<div
				class="bclg-table-column relative"
				v-for="(col, i) in columns"
				:key="col"
				:class="{
					selected: isColumnSelected(i),
					even: i % 2 === 0,
				}"
				:style="{
					'--color-cell-inherit':
						columnColors[col] ??
						defaultColumnColor,
				}"
			>
				<div
					v-for="(v, row) in data[col]"
					class="bclg-table-cell"
					:key="row"
					:class="{
				even: (row as number) % 2 === 0,
				selected: isRowSelected(col, row as number),
			}"
				>
					{{ v }}
				</div>
			</div>
		</div>
	</div>
	{{ data }}
	{{ allowAddCols }}
	{{ allowAddRows }}
	{{ editable }}
	{{ keyColumn }}
	{{ readonlyColumns }}
	{{ defaultValues }}
</template>

<style scoped>
@reference '../../.storybook/style.css';

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
	@apply h-cell-height
		leading-cell-height
		text-center
		border
		border-transparent
		bg-clip-border

		text-cell-inherit

		bg-white
		[.even,.even>*]:bg-gray-50
		[.even>.even]:bg-gray-100

		[.selected>.selected]:border-blue-500
		[.selected+.selected>.selected]:border-l-transparent
		[.selected:has(+.selected)>.selected]:border-r-transparent
		[.selected+.selected]:!border-t-transparent
		has-[+.selected]:!border-b-transparent
		
		[.selected>.selected]:inset-shadow-select
		[.selected>.selected]:inset-shadow-blue-50/50
		[.even.selected>.selected,.selected>.even.selected]:inset-shadow-blue-100/90
		[.even.selected>.even.selected]:inset-shadow-blue-200/90;

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
		border-b-cell-inherit
		text-shadow-2xl
		text-shadow-cell-inherit
		[&.highlight>.header-title]:before:content-['@']
		first:rounded-tl-lg
		last:rounded-tr-lg;
}

.table-cell-input {
	width: 100% !important;
	text-align: center !important;

	.mdc-text-field__input {
		text-align: center !important;
		line-height: var(
			--spacing-cell-height
		) !important;
	}
	.mdc-text-field {
		padding: 0 !important;
		background-color: transparent !important;

		.mat-mdc-form-field-infix {
			padding: 0 !important;
			width: 100% !important;
			height: var(
				--spacing-cell-height
			) !important;
			min-height: var(
				--spacing-cell-height
			) !important;
		}
	}

	input {
		appearance: textfield !important;
		color: inherit !important;

		&::-webkit-outer-spin-button,
		&::-webkit-inner-spin-button {
			-webkit-appearance: none !important;
			margin: 0 !important;
		}
	}

	.mat-mdc-select {
		.mat-mdc-select-trigger {
			display: block !important;
			position: static !important;

			.mat-mdc-select-value {
				line-height: var(
					--spacing-cell-height
				) !important;
			}

			.mat-mdc-select-arrow-wrapper {
				display: block !important;
				position: absolute !important;
				right: 0.25em !important;
				top: 50% !important;
				transform: translateY(-50%) !important;
				height: auto !important;
			}
		}
	}
}
</style>
