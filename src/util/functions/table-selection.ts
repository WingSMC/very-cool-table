import { clamp, isEqual } from 'lodash';
import {
	computed,
	ref,
	watch,
	type ComputedRef,
	type ModelRef,
	type ShallowReactive,
} from 'vue';
import type { TableProps } from '../../types';
import type {
	ColumnKey,
	SomeColumn,
} from './table-ops';
import { blurActiveElement } from './util';

export type TableSelection = {
	start: TableSelectionCoord;
	end: TableSelectionCoord;
};

export type TableSelectionCoord = {
	col: number;
	row: number;
};

export type SelectionService<T> = ReturnType<
	typeof useTableSelection<T>
>;

export function useTableSelection<T>(
	columns: ModelRef<ColumnKey<T>[]>,
	props: ShallowReactive<TableProps<T>>,
	keyColumnData: ComputedRef<SomeColumn>,
) {
	const editedCell = ref<
		TableSelectionCoord | undefined
	>(undefined);

	let selectionStartCell:
		| TableSelectionCoord
		| undefined;

	const lastRowIndex = computed(
		() => keyColumnData.value.length - 1,
	);
	const lastColIndex = computed(
		() => columns.value.length - 1,
	);

	const selection = ref<
		TableSelection | undefined
	>(undefined);

	const selTopLeft = computed(() => {
		const sel = selection.value;

		if (sel === undefined) return undefined;

		return {
			col: Math.min(sel.start.col, sel.end.col),
			row: Math.min(sel.start.row, sel.end.row),
		};
	});
	const selBottomRight = computed(() => {
		const sel = selection.value;

		if (sel === undefined) return undefined;

		return {
			col: Math.max(sel.start.col, sel.end.col),
			row: Math.max(sel.start.row, sel.end.row),
		};
	});

	// Remove focus from everything outside the table
	watch(selection, (sel, prevSel) => {
		if (
			sel === undefined ||
			isEqual(sel, prevSel)
		) {
			return;
		}

		blurActiveElement();
		setEditedCell(undefined);
	});

	/* MOUSE DRAG & SHIFT SELECT */
	function onSelectionStart(
		col: number,
		row: number,
		e: MouseEvent,
	) {
		e.preventDefault();

		if (e.shiftKey && selection.value) {
			selection.value = {
				start: selection.value!.start,
				end: { col, row },
			};
			return;
		}
		if (isEditedCell(col, row)) return;

		const cell = { col, row };
		selectionStartCell = cell;
	}
	function onSelectionMove(
		column: number,
		row: number,
		e: MouseEvent,
	) {
		if (
			(e.buttons | e.button) !== 1 ||
			e.shiftKey
		)
			return;
		_selectionMove(column, row);
	}
	function onSelectionEnd(
		column: number,
		row: number,
	) {
		_selectionMove(column, row);
		selectionStartCell = undefined;
	}
	function _selectionMove(
		col: number,
		row: number,
	) {
		if (selectionStartCell) {
			const startCol = selectionStartCell.col;
			const startRow = selectionStartCell.row;

			selection.value = {
				start: { col: startCol, row: startRow },
				end: { col, row },
			};
		} else {
			selectionStartCell = { col, row };
		}
	}

	/* SELECT */
	function selectColumn(column: number) {
		selection.value = {
			start: { col: column, row: 0 },
			end: {
				col: column,
				row: lastRowIndex.value,
			},
		};
	}
	function _selectEditedCell() {
		const edited = editedCell.value;
		if (edited === undefined) return;

		selection.value = {
			start: edited,
			end: edited,
		};
	}
	function selectLastRow() {
		const row = lastRowIndex.value;
		selection.value = {
			start: { row, col: 0 },
			end: { row, col: lastColIndex.value },
		};
	}
	function selectAll() {
		selection.value = {
			start: { col: 0, row: 0 },
			end: {
				col: lastColIndex.value,
				row: lastRowIndex.value,
			},
		};
	}
	function extendSelection(
		colDir: number,
		rowDir: number,
	) {
		const s = selection.value;
		if (!s) return;

		const col = clamp(
			s.end.col + colDir,
			0,
			lastColIndex.value,
		);
		const row = clamp(
			s.end.row + rowDir,
			0,
			lastRowIndex.value,
		);

		selection.value!.end = { col, row };
	}
	function getSelection() {
		_selectEditedCell();
		return selection.value;
	}
	function singleSelection() {
		const s = getSelection();
		if (!s) return;
		selection.value!.end = { ...s.start };
	}
	function constrainToCol():
		| TableSelection
		| undefined {
		const s = getSelection();
		if (!s) return undefined;

		selection.value!.end.col = s.start.col;
		return selection.value;
	}
	function move(colDir: number, rowDir: number) {
		const s = getSelection();
		if (!s) return;

		/* 		const isSingleCell = isEqual(
			s.start,
			s.end,
		) */

		const scol = clamp(
			s.start.col + colDir,
			0,
			lastColIndex.value,
		);

		const srow = clamp(
			s.start.row + rowDir,
			0,
			lastRowIndex.value,
		);

		const ecol = clamp(
			s.end.col + colDir,
			0,
			lastColIndex.value,
		);
		const erow = clamp(
			s.end.row + rowDir,
			0,
			lastRowIndex.value,
		);

		selection.value!.start.col = scol;
		selection.value!.start.row = srow;
		selection.value!.end.col = ecol;
		selection.value!.end.row = erow;
	}

	/* DESELECT */
	/* function deselectSelectionThenSetEditedCell(
		col: number,
		row: number,
	) {
		deselect();
		setEditedCell({ col, row });
	} */
	function deselect() {
		selection.value = undefined;
		selectionStartCell = undefined;
		editedCell.value = undefined;
	}

	/* EDIT / END EDIT */
	function setEditedCell(
		coord: TableSelectionCoord | undefined,
	) {
		if (!props.editable) return;
		editedCell.value = coord;
	}

	/* IS... */
	function isColumnSelected(column: number) {
		if (selection.value === undefined) {
			return false;
		}

		const minCol = selTopLeft.value!.col;
		const maxCol = selBottomRight.value!.col;

		return minCol <= column && column <= maxCol;
	}
	function isRowSelected(row: number) {
		if (selection.value === undefined) {
			return false;
		}

		const minRow = selTopLeft.value!.row;
		const maxRow = selBottomRight.value!.row;

		return minRow <= row && row <= maxRow;
	}
	function isEditedCell(
		column: number,
		index: number,
	) {
		if (editedCell.value === undefined)
			return false;

		return (
			editedCell.value.col === column &&
			editedCell.value.row === index
		);
	}

	const hasNoSelection = computed(
		() =>
			(selection.value ?? editedCell.value) ===
			undefined,
	);
	const hasSelection = computed(
		() => !hasNoSelection.value,
	);

	return {
		editedCell: editedCell as ComputedRef<
			TableSelectionCoord | undefined
		>,
		onSelectionStart,
		onSelectionMove,
		onSelectionEnd,
		selectColumn,
		selectLastRow,
		selectAll,
		extendSelection,
		extendSelectionLeft: () =>
			extendSelection(-1, 0),
		extendSelectionRight: () =>
			extendSelection(1, 0),
		extendSelectionUp: () =>
			extendSelection(0, -1),
		extendSelectionDown: () =>
			extendSelection(0, 1),
		singleSelection,
		constrainToCol,
		move,
		moveLeft: () => move(-1, 0),
		moveRight: () => move(1, 0),
		moveUp: () => move(0, -1),
		moveDown: () => move(0, 1),
		deselect,

		isColumnSelected,
		isRowSelected,
		isEditedCell,
		hasSelection,
		hasNoSelection,

		setEditedCell,
		getSelectedCell: getSelection,
		selection,
		selTopLeft,
		selBottomRight,
		lastRowIndex,
		lastColIndex,
	};
}
