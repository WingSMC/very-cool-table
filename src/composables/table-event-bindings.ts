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
	useEventListener(document, 'copy', e =>
		ops.copy(e),
	);
	useEventListener(document, 'paste', e =>
		ops.paste(e),
	);
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

			case ' ':
				if (e.ctrlKey) {
					if (e.shiftKey) {
						sel.selectColumn(
							sel.selection.value!.end.col,
						);
					} else {
						sel.selectRow();
					}
					break;
				}
				defaultAction(e);
				return;

			case 'ArrowLeft':
				if (e.ctrlKey) {
					ops.moveSelCol(-1);
				} else if (e.shiftKey) {
					sel.extendSelection(-1, 0);
				} else if (e.altKey) {
					sel.move(-1, 'col', false);
				} else {
					sel.move(-1, 'col');
				}
				break;

			case 'ArrowRight':
				if (e.ctrlKey) {
					ops.moveSelCol(1);
				} else if (e.shiftKey) {
					sel.extendSelection(1, 0);
				} else if (e.altKey) {
					sel.move(1, 'col', false);
				} else {
					sel.move(1, 'col');
				}
				break;

			case 'ArrowUp':
				if (e.ctrlKey) {
					ops.moveRow(-1);
				} else if (e.shiftKey) {
					sel.extendSelection(0, -1);
				} else if (e.altKey) {
					sel.move(-1, 'row', false);
				} else {
					sel.move(-1, 'row');
				}
				break;

			case 'ArrowDown':
				if (e.ctrlKey) {
					ops.moveRow(1);
				} else if (e.shiftKey) {
					sel.extendSelection(0, 1);
				} else if (e.altKey) {
					sel.move(1, 'row', false);
				} else {
					sel.move(1, 'row');
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
					sel.move(-1, 'row');
				} else {
					sel.move(1, 'row');
				}
				break;

			case 'Escape':
				sel.singleSelection();
				break;

			case 'Tab':
				if (e.shiftKey) {
					sel.move(-1, 'col');
				} else {
					sel.move(1, 'col');
				}
				break;
		}

		e.preventDefault();
		e.stopPropagation();
	});
}
