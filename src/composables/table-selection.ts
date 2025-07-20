import {
	computed,
	ref,
	watch,
	type ComputedRef,
	type ModelRef,
	type Ref,
	type ShallowReactive,
} from 'vue';
import type { TableProps } from '../types';
import {
	blurActiveElement,
	clamp,
	isEqual,
} from '../util/util';

export type TableSelection = {
	start: TableSelectionCoord;
	end: TableSelectionCoord;
};

export type TableSelectionCoord = {
	col: number;
	row: number;
};

export type SelectionService = ReturnType<
	typeof useTableSelection
>;

export function useTableSelection(
	columns: ModelRef<string[]>,
	props: ShallowReactive<TableProps>,
	keyColumn: Ref<symbol[]>,
) {
	const editedCell = ref<
		TableSelectionCoord | undefined
	>(undefined);

	let selectionStartCell:
		| TableSelectionCoord
		| undefined;

	const lastRowIndex = computed(
		() => keyColumn.value.length - 1,
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
	watch(
		selection,
		sel => {
			if (!sel) return;

			blurActiveElement();
		},
		{ deep: true },
	);

	/* MOUSE DRAG & SHIFT SELECT */
	function onMouseSelectionStart(
		col: number,
		row: number,
		e: MouseEvent,
	) {
		if (
			editedCell.value &&
			isEqual(editedCell.value, { col, row })
		) {
			return;
		}

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
	function onMouseSelectionMove(
		column: number,
		row: number,
		e: MouseEvent,
	) {
		if (
			(e.buttons | e.button) !== 1 ||
			e.shiftKey
		) {
			return;
		}

		_selectionMove(column, row);
	}
	function onMouseSelectionEnd(
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
		setEditedCell(undefined);
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
		if (!edited) return;

		setEditedCell(undefined);
		selection.value = {
			start: edited,
			end: edited,
		};
	}
	function selectLastRow() {
		setEditedCell(undefined);
		const row = lastRowIndex.value;
		selection.value = {
			start: { row, col: 0 },
			end: { row, col: lastColIndex.value },
		};
	}
	function selectAll() {
		setEditedCell(undefined);
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

		setEditedCell(undefined);
		selection.value!.end = { col, row };
	}
	function getSelection() {
		_selectEditedCell();
		return selection.value;
	}
	function singleSelection() {
		const s = getSelection();
		if (!s) return;
		document.getSelection()?.removeAllRanges();
		setEditedCell(undefined);
		selection.value!.start = { ...s.end };
		return selection.value;
	}
	function constrainToCol():
		| TableSelection
		| undefined {
		const s = getSelection();
		if (!s) return undefined;

		selection.value!.end.col = s.start.col;
		return selection.value;
	}
	function move(
		colDir: number,
		rowDir: number,
		single = true,
	) {
		const s = single
			? singleSelection()
			: getSelection();
		if (!s) return;

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

	function deselect() {
		selection.value = undefined;
		selectionStartCell = undefined;
		setEditedCell(undefined);
	}

	function setEditedCell(
		coord: TableSelectionCoord | undefined,
	) {
		if (
			!props.editable ||
			(coord && isColumnReadonly(coord.col))
		) {
			return;
		}

		editedCell.value = coord;
	}

	/* IS... */
	function isColumnSelected(column: number) {
		if (!selection.value) return false;

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
		if (!editedCell.value) return false;

		return (
			editedCell.value.col === column &&
			editedCell.value.row === index
		);
	}
	function isColumnReadonly(col: number) {
		const colKey = columns.value[col];
		return colKey
			? props.readonlyColumns.includes(colKey)
			: false;
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
		onSelectionStart: onMouseSelectionStart,
		onSelectionMove: onMouseSelectionMove,
		onSelectionEnd: onMouseSelectionEnd,
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

		isColumnReadonly,
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
