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

		const cell = { col, row };
		if (e.shiftKey && selection.value) {
			selection.value = {
				start: selection.value!.start,
				end: cell,
			};
			return;
		}
		if (isEditedCell(col, row)) return;

		selectionStartCell = cell;
		setEditedCell(undefined);
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
		setEditedCell(undefined);
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
	function selectRow() {
		const s = getSelection();
		if (!s) return;

		selectRowAt(s.end.row);
	}
	function selectRowAt(row: number) {
		setEditedCell(undefined);
		selection.value = {
			start: { col: 0, row },
			end: { col: lastColIndex.value, row },
		};
	}
	function selectLastRow() {
		selectRowAt(lastRowIndex.value);
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
	function selectCell(col: number, row: number) {
		setEditedCell(undefined);
		selection.value = {
			start: { col, row },
			end: { col, row },
		};
	}
	function singleSelection() {
		const s = getSelection();
		if (!s) return;
		document.getSelection()?.removeAllRanges();
		setEditedCell(undefined);
		selection.value!.start = { ...s.end };
		return selection.value;
	}
	function constrainToCol(
		col?: number,
	): TableSelection | undefined {
		if (col === undefined) {
			const s = getSelection();
			if (!s) return undefined;
			col = s.end.col;
		} else {
			setEditedCell(undefined);
			selection.value!.end.col = col;
		}

		selection.value!.start.col = col;
		return selection.value;
	}
	function constrainToRow(row?: number) {
		if (row === undefined) {
			const s = getSelection();
			if (!s) return undefined;
			row = s.end.row;
		} else {
			setEditedCell(undefined);
			selection.value!.end.row = row;
		}

		selection.value!.start.row = row;
		return selection.value;
	}
	function move(
		dist: 1 | -1,
		dir: 'col' | 'row',
		single = true,
		depth = 0,
	) {
		const s = single
			? singleSelection()
			: getSelection();
		if (!s) return;

		let sTarget = s.start[dir] + dist;
		const max =
			dir === 'col'
				? lastColIndex.value
				: lastRowIndex.value;

		if (single) {
			if (sTarget < 0) {
				sTarget = max;
				if (depth > 1) return;

				move(
					-1,
					dir === 'col' ? 'row' : 'col',
					true,
					depth + 1,
				);
			} else if (max < sTarget) {
				sTarget = 0;
				if (depth > 1) return;

				move(
					1,
					dir === 'col' ? 'row' : 'col',
					true,
					depth + 1,
				);
			}
			selection.value!.start[dir] = sTarget;
			selection.value!.end[dir] = sTarget;
			return;
		}

		const start = clamp(sTarget, 0, max);
		const end = clamp(s.end[dir] + dist, 0, max);

		selection.value!.start[dir] = start;
		selection.value!.end[dir] = end;
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

	function setSelection(
		sel: TableSelection | undefined,
	) {
		setEditedCell(undefined);
		selection.value = sel;
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
		selection: selection as ComputedRef<
			TableSelection | undefined
		>,
		setEditedCell,
		setSelection,
		getSelection,
		selTopLeft,
		selBottomRight,
		lastRowIndex,
		lastColIndex,

		onMouseSelectionStart,
		onMouseSelectionMove,
		onMouseSelectionEnd,
		selectColumn,
		selectRow,
		selectRowAt,
		selectLastRow,
		selectAll,
		extendSelection,
		selectCell,
		singleSelection,
		constrainToCol,
		constrainToRow,
		move,
		deselect,

		isColumnReadonly,
		isColumnSelected,
		isRowSelected,
		isEditedCell,
		hasSelection,
		hasNoSelection,
	};
}
