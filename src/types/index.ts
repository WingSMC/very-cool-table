import type { MenuItem } from 'primevue/menuitem';
import type {
	CellKeyToDefaultValueMap,
	CellKeyToPrecisionMap,
	ColumnKey,
	ColumnType,
	ColumnTypes,
} from '../util';

type RequiredProps<T> = {
	keyColumn: ColumnKey<T>;
};

type DefaultedProps<T> = {
	allowAddCols: boolean;
	allowAddRows: boolean;
	defaultColumnColor: string;
	editable: boolean;

	columnColors: Record<string, string>;
	columnPrecisions: CellKeyToPrecisionMap<T>;
	columnTypes: ColumnTypes<T>;
	defaultValues: CellKeyToDefaultValueMap<T>;
	readonlyColumns: ColumnKey<T>[];

	extraHeaderMenuItems: MenuItem[];
	overrideTypeToCellComponentTypeMap: Record<
		ColumnType | number,
		any
	>;
};

export type TableProps<T> = RequiredProps<T> &
	DefaultedProps<T>;

/* RequiredProps<T> & Partial<DefaultedProps<T>> */
export type InputProps<T> = {
	keyColumn: ColumnKey<T>;

	allowAddCols?: boolean;
	allowAddRows?: boolean;
	defaultColumnColor?: string;
	editable?: boolean;

	columnColors?: Record<string, string>;
	columnPrecisions?: CellKeyToPrecisionMap<T>;
	columnTypes?: ColumnTypes<T>;
	defaultValues?: CellKeyToDefaultValueMap<T>;
	readonlyColumns?: ColumnKey<T>[];

	extraHeaderMenuItems?: MenuItem[];
	overrideTypeToCellComponentTypeMap?: Record<
		ColumnType | number,
		any
	>;
};
