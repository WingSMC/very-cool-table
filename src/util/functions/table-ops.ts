import { triggerRef, type ModelRef } from 'vue';
import type { TableProps } from '../../types';
import type { SelectionService } from './table-selection';

type StringKey<T> = Exclude<
	keyof T,
	number | symbol
>;

export type KeysOfType<T, V> = {
	[K in StringKey<T>]: T[K] extends V ? K : never;
}[StringKey<T>];

export const ColumnTypeEnum = {
	//  Basic types (lower 8 bits)
	BasicTypeMask: 0b1111_1111,
	Number: 0b0000_0001,
	String: 0b0000_0010,
	Boolean: 0b0000_0100,
} as const;

export type ColumnType =
	(typeof ColumnTypeEnum)[keyof typeof ColumnTypeEnum];

type Col<T> = T[];

export type SomeColumn =
	| Col<string>
	| Col<number>;

export type ColumnKey<T> = KeysOfType<
	T,
	SomeColumn
>;

export type NumberColumnKey<T> = KeysOfType<
	T,
	Col<number>
>;

export type CellKeyToPrecisionMap<T> = Partial<
	Record<NumberColumnKey<T>, -1 | 0 | 2>
>;

export type ColumnTypes<T> = Partial<
	Record<ColumnKey<T>, ColumnType>
>;

export type ColumnValueType<
	C extends SomeColumn,
> = C extends Col<string> ? string : number;

export type CellKeyToDefaultValueMap<T> =
	Partial<{
		[K in ColumnKey<T>]: T[K] extends SomeColumn
			? ColumnValueType<T[K]>
			: never;
	}>;

export type ColumnMap<T> = Record<
	ColumnKey<T>,
	T[ColumnKey<T>]
>;
export type PartialColumnMap<V> = Partial<
	ColumnMap<V>
>;

export function useTableOps<T extends {}>(
	table: ModelRef<T>,
	columns: ModelRef<ColumnKey<T>[]>,
	props: TableProps<T>,
	sel: SelectionService<T>,
) {
	function _generateUniqueColumnKey(
		base: string,
	): ColumnKey<T> {
		let i = 0;
		let key: ColumnKey<T>;
		do {
			key = `${base}${i}` as ColumnKey<T>;
			i++;
		} while (key in table.value);
		return key;
	}

	function pushColumn() {
		if (!props.editable || !props.allowAddCols) {
			return;
		}

		const colName =
			_generateUniqueColumnKey('col');
		columns.value.push(colName);
		table.value[colName] = Array.from(
			{ length: sel.lastRowIndex.value + 1 },
			() => props.defaultValues[colName] ?? '',
		) as T[ColumnKey<T>];
	}

	function insertColumn() {
		if (!props.editable || !props.allowAddCols) {
			return;
		}

		const s = sel.constrainToCol();
		if (!s) return;

		const index = s.start.col + 1;
		const colName = (prompt(
			'Enter column name:',
		) ??
			_generateUniqueColumnKey(
				'col',
			)) as ColumnKey<T>;

		columns.value.splice(index, 0, colName);
		triggerRef(columns);
		table.value[colName] = Array.from(
			{ length: sel.lastRowIndex.value + 1 },
			() => props.defaultValues[colName] ?? '',
		) as T[ColumnKey<T>];
	}

	function deleteColumns() {
		if (!props.editable || !props.allowAddCols) {
			return;
		}

		const s = sel.selection.value;
		if (!s) return;
		const start = sel.selTopLeft.value!.col;
		const end = sel.selBottomRight.value!.col;

		const nCols = end - start + 1;
		const keys = columns.value.splice(
			start,
			nCols,
		);
		triggerRef(columns);
		for (const key of keys) {
			delete table.value[key];
		}
		// triggerRef(table);
	}

	function pushRow() {
		if (!props.editable || !props.allowAddRows) {
			return;
		}

		for (const column of columns.value) {
			if (!table.value[column]) continue;

			const v = props.defaultValues[column] ?? '';
			// @ts-expect-error ts is dumb
			table.value[column].push(v);
		}
	}

	function insertRow() {
		if (!props.editable || !props.allowAddRows) {
			return;
		}

		const i = sel.getSelectedCell()!.end.row + 1;

		for (const column of columns.value) {
			if (!table.value[column]) continue;
			(table.value[column] as SomeColumn).splice(
				i,
				0,
				(props.defaultValues[column] as never) ??
					'',
			);
		}
		triggerRef(table);

		sel.selection.value!.start.row = i;
		sel.selection.value!.end.row = i;
	}

	function deleteRows() {
		if (!props.editable || !props.allowAddRows) {
			return;
		}

		const start = sel.selTopLeft.value!.row;
		const end = sel.selBottomRight.value!.row;
		const nRows = end - start + 1;

		for (const column of columns.value) {
			if (!table.value[column]) continue;

			(table.value[column] as SomeColumn).splice(
				start,
				nRows,
			);
		}

		triggerRef(table);

		if (sel.lastRowIndex.value < end) {
			sel.selectLastRow();
		}
	}

	function _pasteIntoTableColumn(
		columnKey: ColumnKey<T>,
		index: number,
		values: SomeColumn,
	) {
		if (!props.editable) return;

		const overflow =
			index +
			values.length -
			(table.value[columnKey] as SomeColumn)
				.length;

		for (let i = 0; i < overflow; i++) {
			pushRow();
		}

		for (let i = 0; i < values.length; i++) {
			(table.value[columnKey] as SomeColumn)[
				index + i
			] = values[i] as never;
		}
	}

	function _isColumnReadonly(col: number) {
		const colKey = columns.value[col];
		return colKey
			? props.readonlyColumns.includes(colKey)
			: false;
	}

	function paste(e: ClipboardEvent) {
		if (
			!props.editable ||
			!e.clipboardData ||
			sel.hasNoSelection.value
		) {
			return;
		}

		_pasteFromExcelTextIntoTable(
			e.clipboardData.getData('text/plain'),
		);
	}
	function _pasteFromExcelTextIntoTable(
		text: string,
	) {
		if (!props.editable) return;

		const {
			col: pasteStartColumn,
			row: pasteStartRow,
		} = sel.selTopLeft.value!;
		text = text.trim();

		const textRows = text
			.split(/\r?\n/)
			.map(row => row.split('\t'));

		const selectedCols = columns.value.slice(
			pasteStartColumn,
			pasteStartColumn + textRows[0].length,
		);

		for (const columnIndex of selectedCols.keys()) {
			const column = selectedCols[columnIndex];
			if (
				props.readonlyColumns.includes(column)
			) {
				continue;
			}

			const type =
				props.columnTypes[column] ??
				ColumnTypeEnum.String;

			switch (
				type & ColumnTypeEnum.BasicTypeMask
			) {
				case ColumnTypeEnum.Number: {
					const precision =
						props.columnPrecisions[
							column as unknown as NumberColumnKey<T>
						] ?? 2;
					const upscale = 10 ** precision;
					const values = textRows.map(row => {
						const cellText = row[columnIndex];
						const v1 = parseFloat(cellText);
						const v = isNaN(v1) ? 0 : v1;

						return (
							Math.round(v * upscale) / upscale
						);
					});
					_pasteIntoTableColumn(
						column,
						pasteStartRow,
						values,
					);
					break;
				}
				case ColumnTypeEnum.String:
				default: {
					const values = textRows.map(
						row => row[columnIndex],
					);
					_pasteIntoTableColumn(
						column,
						pasteStartRow,
						values,
					);
					break;
				}
			}
		}

		const { col, row } = sel.selTopLeft.value!;
		sel.selection.value = {
			start: { col, row },
			end: {
				col:
					pasteStartColumn +
					textRows[0].length -
					1,
				row: pasteStartRow + textRows.length - 1,
			},
		};
	}

	function copy(e: ClipboardEvent) {
		if (
			sel.hasNoSelection.value ||
			!e.clipboardData
		) {
			return;
		}

		e.stopPropagation();
		e.preventDefault();
		e.clipboardData.setData(
			'text/plain',
			_stringifySelectedCellContentsInExcelFormat(),
		);
	}
	function _stringifySelectedCellContentsInExcelFormat() {
		const { col: startColumn, row: startIndex } =
			sel.selTopLeft.value!;
		const { col: endColumn, row: endIndex } =
			sel.selBottomRight.value!;

		const results: string[] = [];
		const selectedCols = columns.value.slice(
			startColumn,
			endColumn + 1,
		);

		for (let i = startIndex; i <= endIndex; i++) {
			const row = selectedCols.map(key => {
				const column = table.value[
					key
				] as SomeColumn;
				if (!column) return '';

				const type =
					props.columnTypes[key] ??
					ColumnTypeEnum.String;
				const value = column[i];

				switch (
					type & ColumnTypeEnum.BasicTypeMask
				) {
					case ColumnTypeEnum.Number: {
						const precision =
							props.columnPrecisions[
								key as unknown as NumberColumnKey<T>
							] ?? 2;
						return (value as number).toFixed(
							precision < 0 ? 0 : precision,
						);
					}
					case ColumnTypeEnum.String:
					default:
						return value.toString();
				}
			});

			results.push(
				row.filter(v => v.length).join('\t'),
			);
		}

		return results.join('\n');
	}

	function resetCells() {
		if (!props.editable) return;

		const { col: startColumn, row: startIndex } =
			sel.selTopLeft.value!;
		const { col: endColumn, row: endIndex } =
			sel.selBottomRight.value!;

		for (
			let j = startColumn;
			j <= endColumn;
			++j
		) {
			const readonly = _isColumnReadonly(j);
			if (readonly) continue;

			const columnName = columns.value[j];
			if (!table.value[columnName]) continue;

			for (
				let i = startIndex;
				i <= endIndex;
				++i
			) {
				(table.value[columnName] as SomeColumn)[
					i
				] =
					(props.defaultValues[
						columnName
					] as never) ?? '';
			}
		}
	}

	function moveSelCol(dir: -1 | 1) {
		if (!props.editable || !props.allowAddCols) {
			return;
		}

		const s = sel.constrainToCol();
		if (!s) return;

		const oldIndex = s.start.col;
		const newIndex = oldIndex + dir;

		if (!_moveCol(oldIndex, newIndex)) return;

		sel.move(dir, 0);
	}
	function _moveCol(
		oldIndex: number,
		newIndex: number,
	) {
		if (
			newIndex < 0 ||
			sel.lastColIndex.value < newIndex
		) {
			return false;
		}

		const temp = columns.value[oldIndex];
		columns.value[oldIndex] =
			columns.value[newIndex];
		columns.value[newIndex] = temp;
		return true;
	}

	return {
		pushRow,
		insertRow,
		deleteRows,

		pushColumn,
		insertColumn,
		deleteColumns,
		moveSelCol,

		copy,
		paste,
		resetCells,
	};
}

export type TableOpsService<T extends {}> =
	ReturnType<typeof useTableOps<T>>;
