import {
	onClickOutside,
	useEventListener,
} from '@vueuse/core';
import { type TemplateRef } from 'vue';
import type { TableProps } from '../types';
import type { TableOpsService } from './table-ops';
import type { SelectionService } from './table-selection';

export function useTableEvents(
	_props: TableProps,
	sel: SelectionService,
	ops: TableOpsService,
	tableContainer: TemplateRef<HTMLElement>,
) {
	onClickOutside(tableContainer, sel.deselect);
	useEventListener(document, 'copy', ops.copy);
	useEventListener(document, 'paste', ops.paste);
	useEventListener(document, 'keydown', e => {
		if (!sel.hasSelection.value) return;

		switch (e.key) {
			// @ts-expect-error
			case 'a':
				if (e.ctrlKey) {
					sel.selectAll();
					break;
				}

			default:
				if (e.ctrlKey || e.metaKey || e.altKey) {
					// Ignore other ctrl/meta key combinations
					return;
				}

				if (/^[a-zA-Z1-9]$/.test(e.key)) {
					ops.editSelected(e.key);
				}

				return;

			case 'ArrowLeft':
				if (e.shiftKey) {
					sel.extendSelectionLeft();
				} else if (e.altKey) {
					ops.moveSelCol(-1);
				} else {
					sel.moveLeft();
				}
				break;

			case 'ArrowRight':
				if (e.shiftKey) {
					sel.extendSelectionRight();
				} else if (e.altKey) {
					ops.moveSelCol(1);
				} else {
					sel.moveRight();
				}
				break;

			case 'ArrowUp':
				if (e.shiftKey) {
					sel.extendSelectionUp();
				} else {
					sel.moveUp();
				}
				break;

			case 'ArrowDown':
				if (e.shiftKey) {
					sel.extendSelectionDown();
				} else {
					sel.moveDown();
				}
				break;

			case 'Delete':
				if (e.ctrlKey) {
					ops.deleteRows();
				} else if (e.shiftKey) {
					ops.deleteColumns();
				} else {
					ops.resetCells();
				}
				break;

			case 'Enter':
				if (e.ctrlKey) {
					if (e.shiftKey) {
						ops.insertColumn();
					} else {
						ops.insertRow();
					}
				} else if (e.shiftKey) {
					sel.moveUp();
				} else {
					sel.moveDown();
				}
				break;

			case 'Escape':
				sel.singleSelection();
				break;

			case 'Tab':
				if (e.shiftKey) {
					sel.moveLeft();
				} else {
					sel.moveRight();
				}
				break;
		}

		e.preventDefault();
		e.stopPropagation();
	});
}
