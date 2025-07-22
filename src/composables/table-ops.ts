import {
	triggerRef,
	type ModelRef,
	type Ref,
} from 'vue';
import {
	ColumnTypeEnum,
	type TableProps,
} from '../types';
import type { SelectionService } from './table-selection';

export function useTableOps(
	table: ModelRef<Record<string, any[]>>,
	columns: ModelRef<string[]>,
	props: TableProps,
	sel: SelectionService,
	keyColumn: Ref<symbol[]>,
) {
	function _generateUniqueColumnKey(): string {
		let key =
			prompt(
				'Enter a unique column name or a new one will be generated:',
			) ?? `col-0`;

		let i = 1;
		while (key in table.value) {
			key = `col-${i}`;
			i++;
		}

		return key;
	}

	function insertColumn() {
		if (!props.editable || !props.allowAddCols) {
			return;
		}

		const s = sel.constrainToCol();
		if (!s) return;

		const index = s.start.col + 1;
		const colName = _generateUniqueColumnKey();

		columns.value.splice(index, 0, colName);
		triggerRef(columns);
		table.value[colName] = Array.from(
			{ length: sel.lastRowIndex.value + 1 },
			() =>
				props.defaultColumnValues[colName] ??
				props.defaultColumnValue,
		);
	}

	function deleteColumns() {
		if (!props.editable || !props.allowAddCols) {
			return;
		}

		const s = sel.selection.value;
		if (!s) return;
		const start = sel.selTopLeft.value!.col;
		const end = sel.selBottomRight.value!.col;

		const newColumns = columns.value.filter(
			(c, i) => {
				const shouldKeep =
					i < start ||
					end < i ||
					props.readonlyColumns.includes(c);
				if (!shouldKeep) {
					delete table.value[c];
				}
				return shouldKeep;
			},
		);
		columns.value = newColumns;
	}

	function pushRow() {
		if (!props.editable || !props.allowAddRows) {
			return;
		}

		for (const column of columns.value) {
			if (!table.value[column]) continue;

			const v =
				props.defaultColumnValues[column] ??
				props.defaultColumnValue;
			table.value[column].push(v);
		}

		keyColumn.value.push(Symbol());
	}

	function insertRowAt(i: number) {
		if (!props.editable || !props.allowAddRows) {
			return;
		}

		for (const column of columns.value) {
			if (!table.value[column]) continue;
			table.value[column].splice(
				i,
				0,
				props.defaultColumnValues[column] ??
					props.defaultColumnValue,
			);
		}
		keyColumn.value.splice(i, 0, Symbol());
		triggerRef(table);
		triggerRef(keyColumn);

		sel.selection.value!.start.row = i;
		sel.selection.value!.end.row = i;
	}
	function insertRow() {
		const i = sel.getSelection()!.end.row + 1;
		insertRowAt(i);
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
			table.value[column].splice(start, nRows);
		}
		keyColumn.value.splice(start, nRows);
		triggerRef(table);
		triggerRef(keyColumn);

		if (sel.lastRowIndex.value < end) {
			sel.selectLastRow();
		}
	}

	function _pasteIntoTableColumn(
		columnKey: string,
		index: number,
		values: any[],
	) {
		if (!props.editable) return;

		const overflow =
			index +
			values.length -
			table.value[columnKey].length;

		for (let i = 0; i < overflow; i++) {
			pushRow();
		}

		for (let i = 0; i < values.length; i++) {
			table.value[columnKey][index + i] =
				values[i];
		}
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
				props.defaultColumnType;

			switch (type) {
				case ColumnTypeEnum.Number: {
					const precision =
						props.columnPrecisions[column] ??
						props.defaultColumnPrecision;
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
				const column = table.value[key];
				const type =
					props.columnTypes[key] ??
					props.defaultColumnType;
				const value = column[i];

				console.log(value);

				switch (type) {
					case ColumnTypeEnum.Number: {
						const precision =
							props.columnPrecisions[key] ??
							props.defaultColumnPrecision;
						return value.toFixed(
							precision < 0 ? 0 : precision,
						);
					}
					case ColumnTypeEnum.String:
					default:
						return value.toString();
				}
			});

			console.log(JSON.stringify(row));

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
			const readonly = sel.isColumnReadonly(j);
			if (readonly) continue;

			const columnName = columns.value[j];
			if (!table.value[columnName]) continue;

			for (
				let i = startIndex;
				i <= endIndex;
				++i
			) {
				table.value[columnName][i] =
					props.defaultColumnValues[columnName] ??
					props.defaultColumnValue;
			}
		}
	}
	function _setCellValue(
		col: number,
		row: number,
		value: any,
	) {
		if (sel.isColumnReadonly(col)) return;

		const columnName = columns.value[col];
		if (!table.value[columnName]) return;

		const colType =
			props.columnTypes[columnName] ??
			props.defaultColumnType;

		switch (colType) {
			case ColumnTypeEnum.Number: {
				if (!/[-0-9\.,]/.test(value)) return;
				const precision =
					props.columnPrecisions[columnName] ??
					props.defaultColumnPrecision;
				const upscale = 10 ** precision;
				value =
					Math.round(value * upscale) / upscale;
				break;
			}
			case ColumnTypeEnum.String:
			default:
				value = value.toString();
				break;
		}

		table.value[columnName][row] = value;
	}
	function editSelected(
		newValue: string,
		event?: KeyboardEvent,
	) {
		if (!props.editable || sel.editedCell.value) {
			return;
		}

		const s = sel.singleSelection();
		if (!s) return;

		const col = s.start.col;
		const row = s.start.row;

		event?.preventDefault();
		_setCellValue(col, row, newValue);
		sel.setEditedCell({
			col,
			row,
		});
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
	function renameSelCol() {
		const s = sel.constrainToCol();
		if (!s) return;
		const index = s.start.col;
		renameCol(index);
	}
	function renameCol(index: number) {
		if (!props.editable || !props.allowAddCols) {
			return;
		}

		const oldName = columns.value[index];
		if (props.readonlyColumns.includes(oldName)) {
			return;
		}

		const newName = _generateUniqueColumnKey();
		columns.value[index] = newName;
		table.value[newName] = table.value[oldName];
		delete table.value[oldName];
	}

	return {
		pushRow,
		insertRow,
		insertRowAt,
		deleteRows,

		insertColumn,
		deleteColumns,
		moveSelCol,
		renameCol,
		renameSelCol,

		copy,
		paste,
		resetCells,
		editSelected,
	};
}

export type TableOpsService = ReturnType<
	typeof useTableOps
>;
