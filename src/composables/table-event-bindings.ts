import {
	onClickOutside,
	useEventListener,
} from '@vueuse/core';
import { type Ref, type TemplateRef } from 'vue';
import type { TableProps } from '../types';
import type { TableOpsService } from './table-ops';
import type { SelectionService } from './table-selection';

export function useTableEvents(
	_props: TableProps,
	sel: SelectionService,
	ops: TableOpsService,
	ctxMenuTarget: Ref<any>,
	tableContainer: TemplateRef<HTMLElement>,
) {
	function defaultAction(e: KeyboardEvent) {
		if (e.ctrlKey || e.metaKey || e.altKey) {
			// Ignore other ctrl/meta key combinations
			return;
		}

		if (/^[-a-zA-Z1-9\.,]$/.test(e.key)) {
			ops.editSelected(e.key);
		}

		return;
	}

	onClickOutside(
		tableContainer,
		() => ctxMenuTarget.value || sel.deselect(),
	);
	useEventListener(document, 'copy', ops.copy);
	useEventListener(document, 'paste', ops.paste);
	useEventListener(document, 'keydown', e => {
		if (!sel.hasSelection.value) return;

		switch (e.key) {
			default:
				defaultAction(e);
				return;

			case 'a':
				if (e.ctrlKey) {
					sel.selectAll();
					break;
				}

				defaultAction(e);
				return;

			case 'r':
				if (e.altKey) {
					ops.renameSelCol();
					break;
				}

				defaultAction(e);
				return;

			case 'ArrowLeft':
				if (e.ctrlKey) {
					ops.moveSelCol(-1);
				} else if (e.shiftKey) {
					sel.extendSelectionLeft();
				} else if (e.altKey) {
					sel.move(-1, 0, false);
				} else {
					sel.move(-1, 0);
				}
				break;

			case 'ArrowRight':
				if (e.ctrlKey) {
					ops.moveSelCol(1);
				} else if (e.shiftKey) {
					sel.extendSelectionRight();
				} else if (e.altKey) {
					sel.move(1, 0, false);
				} else {
					sel.move(1, 0);
				}
				break;

			case 'ArrowUp':
				if (e.shiftKey) {
					sel.extendSelectionUp();
				} else if (e.altKey) {
					sel.move(0, -1, false);
				} else {
					sel.move(0, -1);
				}
				break;

			case 'ArrowDown':
				if (e.shiftKey) {
					sel.extendSelectionDown();
				} else if (e.altKey) {
					sel.move(0, 1, false);
				} else {
					sel.move(0, 1);
				}
				break;

			case 'Delete':
				if (e.ctrlKey) {
					if (e.shiftKey) {
						ops.deleteColumns();
					} else {
						ops.deleteRows();
					}
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
					sel.move(0, -1);
				} else {
					sel.move(0, 1);
				}
				break;

			case 'Escape':
				sel.singleSelection();
				break;

			case 'Tab':
				if (e.shiftKey) {
					sel.move(-1, 0);
				} else {
					sel.move(1, 0);
				}
				break;
		}

		e.preventDefault();
		e.stopPropagation();
	});
}
