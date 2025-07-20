import type { InjectionKey } from 'vue';
import type { TableOpsService } from '../composables/table-ops';
import type { SelectionService } from '../composables/table-selection';

export const SELECTION_SERVICE = Symbol(
	'SELECTION_SERVICE',
) as InjectionKey<SelectionService>;

export const OPERATIONS_SERVICE = Symbol(
	'OPERATIONS_SERVICE',
) as InjectionKey<TableOpsService>;
