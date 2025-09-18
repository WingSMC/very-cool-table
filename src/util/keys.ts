import type { InjectionKey, Ref } from 'vue';
import type { TableOpsService } from '../composables/table-ops';
import type { SelectionService } from '../composables/table-selection';

export const SELECTION_SERVICE: InjectionKey<SelectionService> =
	Symbol('SELECTION_SERVICE');

export const OPERATIONS_SERVICE: InjectionKey<TableOpsService> =
	Symbol('OPERATIONS_SERVICE');

export const KEY_COLUMN: InjectionKey<
	Ref<symbol[]>
> = Symbol('KEY_COLUMN');
