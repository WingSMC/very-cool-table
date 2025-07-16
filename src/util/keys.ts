import type { InjectionKey } from 'vue';
import type { useTableSelection } from './functions/table-selection';

export const SELECTION_SERVICE = Symbol(
	'SELECTION_SERVICE',
) as InjectionKey<
	ReturnType<typeof useTableSelection>
>;
