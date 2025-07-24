import type { ContextMenu } from 'primevue';
import {
	computed,
	ref,
	type ComponentInstance,
	type TemplateRef,
} from 'vue';
import type { TableProps } from '../types';
import type { TableOpsService } from './table-ops';
import type { SelectionService } from './table-selection';
export function useContextMenu(
	menu: TemplateRef<
		ComponentInstance<typeof ContextMenu>
	>,
	props: TableProps,
	sel: SelectionService,
	ops: TableOpsService,
) {
	const ctxMenuTarget = ref<
		| {
				colName: string;
				col: number;
				row?: number;
		  }
		| undefined
	>(undefined);
	const ctxTargetReadonly = computed(() => {
		return (
			ctxMenuTarget.value &&
			props.readonlyColumns.includes(
				ctxMenuTarget.value.colName,
			)
		);
	});

	const ctxColEditItems = computed(() =>
		props.allowAddCols
			? [
					{
						label: 'Move Column Right',
						icon: 'pi pi-arrow-right',
						kbd: ['Ctrl', '→'],
						command: () => {
							const t = ctxMenuTarget.value!;
							if (t.row) {
								sel.selectCell(t.col, t.row);
							} else {
								sel.selectColumn(t.col);
							}

							ops.moveSelCol(1);
						},
					},
					{
						label: 'Move Column Left',
						icon: 'pi pi-arrow-left',
						kbd: ['Ctrl', '←'],
						command: () => {
							const t = ctxMenuTarget.value!;
							if (t.row) {
								sel.selectCell(t.col, t.row);
							} else {
								sel.selectColumn(t.col);
							}

							ops.moveSelCol(-1);
						},
					},
					{
						label: 'Insert Column',
						icon: 'pi pi-plus',
						kbd: ['Ctrl', 'Shift', 'Enter'],
						command: () => {
							const t = ctxMenuTarget.value!;
							if (t.row) {
								sel.selectCell(t.col, t.row);
							} else {
								sel.selectColumn(t.col);
							}

							ops.insertColumn();
						},
					},
					{
						label: 'Delete Column',
						icon: 'pi pi-trash',
						kbd: ['Ctrl', 'Shift', 'Delete'],
						disabled: ctxTargetReadonly.value,
						command: () => {
							const t = ctxMenuTarget.value!;
							if (t.row) {
								sel.selectCell(t.col, t.row);
							} else {
								sel.selectColumn(t.col);
							}

							ops.deleteColumns();
						},
					},
					{
						label: 'Rename Column',
						icon: 'pi pi-pencil',
						kbd: ['Alt', 'R'],
						disabled: ctxTargetReadonly.value,
						command: () => {
							const t = ctxMenuTarget.value!;
							if (t.row) {
								sel.selectCell(t.col, t.row);
								ops.renameSelCol();
							} else {
								ops.renameCol(
									ctxMenuTarget.value!.col,
								);
							}
						},
					},
			  ]
			: [],
	);
	const ctxRowEditItems = computed(() =>
		props.allowAddRows
			? [
					{
						label: 'Move Row Up',
						icon: 'pi pi-arrow-up',
						kbd: ['Ctrl', '↑'],
						disabled: !ctxMenuTarget.value?.row,
						command: () =>
							ops.moveRowAt(
								ctxMenuTarget.value!.row!,
								-1,
							),
					},
					{
						label: 'Move Row Down',
						icon: 'pi pi-arrow-down',
						kbd: ['Ctrl', '↓'],
						disabled: !ctxMenuTarget.value?.row,
						command: () =>
							ops.moveRowAt(
								ctxMenuTarget.value!.row!,
								1,
							),
					},
					{
						label: 'Insert Row',
						icon: 'pi pi-plus',
						kbd: ['Ctrl', 'Enter'],
						command: () => {
							const t = ctxMenuTarget.value!;
							if (t.row) {
								ops.insertRowAt(t.row + 1);
							} else {
								ops.pushRow();
							}
						},
					},
					{
						label: 'Delete Row',
						icon: 'pi pi-trash',
						kbd: ['Ctrl', 'Delete'],
						disabled: !ctxMenuTarget.value?.row,
						command: () => {
							const t = ctxMenuTarget.value!;
							sel.selectCell(t.col, t.row!);
							ops.deleteRows();
						},
					},
			  ]
			: [],
	);
	const ctxEditableItems = computed(() =>
		props.editable
			? [
					...ctxColEditItems.value,
					...ctxRowEditItems.value,
			  ]
			: [],
	);
	const ctxMenuItems = computed(() => {
		return [
			...props.extraCtxMenuItems,
			...ctxEditableItems.value,
			{
				label: 'Select All',
				icon: 'pi pi-check-square',
				kbd: ['Ctrl', 'A'],
				command: () => sel.selectAll(),
			},
			{
				label: 'Select Row',
				icon: 'pi pi-check-square',
				kbd: ['Ctrl', 'Space'],
				disabled: !ctxMenuTarget.value?.row,
				command: () =>
					sel.selectRowAt(
						ctxMenuTarget.value!.row!,
					),
			},
			{
				label: 'Select Column',
				icon: 'pi pi-check-square',
				kbd: ['Ctrl', 'Shift', 'Space'],
				command: () =>
					sel.selectColumn(
						ctxMenuTarget.value!.col,
					),
			},
		];
	});

	function ctxMenuShow(
		event: MouseEvent,
		colName: string,
		col: number,
		row?: number,
	) {
		ctxMenuTarget.value = {
			colName,
			col,
			row,
		};
		menu.value?.show(event);
	}

	return {
		ctxMenuTarget,
		ctxMenuItems,
		ctxMenuShow,
	};
}
