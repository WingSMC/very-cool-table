import type { MenuItem } from 'primevue/menuitem';

export const ColumnTypeEnum = {
	//  Basic types (lower 8 bits)
	Number: 0b0000_0001,
	String: 0b0000_0010,
	Boolean: 0b0000_0100,
} as const;

export type ColumnType =
	(typeof ColumnTypeEnum)[keyof typeof ColumnTypeEnum];

export type CellKeyToPrecisionMap = Partial<
	Record<string, number>
>;
export type CellKeyToDefaultValueMap = Record<
	string,
	any
>;

export type InputProps = {
	/**
	 * Allow editing.
	 */
	editable?: boolean;
	/**
	 * Allow adding, deleting and editing columns.
	 */
	allowAddCols?: boolean;
	/**
	 * Allow adding, deleting rows.
	 */
	allowAddRows?: boolean;
	/**
	 * The default value for cells, used for initializing new cells.
	 * Defaults to `''`.
	 */
	defaultColumnValue?: any;
	/**
	 * The default type for columns, used for formatting, cell rendering and validation.
	 * Defaults to `ColumnTypeEnum.String`.
	 */
	defaultColumnType?: number;
	/**
	 * Default precision for number columns, used for formatting numbers.
	 * Defaults to `2` decimal places.
	 */
	defaultColumnPrecision?: number;
	/**
	 * The default color for columns, used for styling.
	 * Defaults to `#000000`.
	 */
	defaultColumnColor?: string;

	/**
	 * Colors for columns, used for styling cells.
	 * Defaults to `defaultColumnColor`.
	 */
	columnColors?: Record<string, string>;
	/**
	 * Precision for number columns, used for formatting numbers. Defaults to `defaultColumnPrecision`.
	 */
	columnPrecisions?: CellKeyToPrecisionMap;
	/**
	 * Types of columns, used for formatting, cell rendering and validation. Defaults to `defaultColumnType`.
	 */
	columnTypes?: Record<string, number>;
	/**
	 * Default values for columns, used when adding/reseting cells.
	 * Defaults to `defaultCellValue`.
	 */
	defaultColumnValues?: CellKeyToDefaultValueMap;
	/**
	 * List of column names that are read-only / cannot be edited.
	 */
	readonlyColumns?:
		| string[]
		| {
				includes: (col: string) => boolean;
		  };

	/**
	 * Extra menu items to add to the header context menu.
	 */
	extraHeaderMenuItems?: MenuItem[];

	/**
	 * Column to cell component type map.
	 * This is used to map column types to specific cell components.
	 * Defaults to the internal `typeToCellComponentTypeMap` that is
	 * computed from `overrideTypeToCellComponentTypeMap`.
	 */
	columnToCellComponentTypeMap?: Record<
		string,
		any
	>;

	/**
	 * Override the default cell component types for specific column types.
	 * You can use this to use custom cell components for specific column types.
	 */
	overrideTypeToCellComponentTypeMap?: Record<
		string,
		any
	>;

	/**
	 * Changes header text direction to vertical.
	 */
	verticalHeader?: boolean;
};

export type TableProps = Required<InputProps>;
