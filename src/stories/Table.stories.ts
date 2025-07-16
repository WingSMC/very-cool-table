import type {
	Meta,
	StoryObj,
} from '@storybook/vue3-vite';
import Table from '../components/Table.vue';

type Data = Record<string, string>;

const meta = {
	title: 'Table',
	// @ts-ignore
	component: Table,
	tags: ['autodocs'],
	subcomponents: {},
	parameters: {
		layout: 'fullscreen',

		docs: {
			description: {
				component:
					'A table component for displaying and editing data.',
			},
		},
		chromatic: {
			delay: 1000,
			viewports: [320, 768, 1024, 1440],
		},
	},
	argTypes: {
		modelValue: {
			control: 'object',
			description:
				'The data to display in the table. Should be an object with keys as column names and values as arrays of column data.',
		},
		columns: {
			control: 'object',
			description:
				'The columns to display in the table. Should be an array of column names. Their order is the order in which they will be displayed.',
		},

		allowAddCols: {
			control: 'boolean',
			description:
				'Allow adding, deleting and editing columns.',
		},
		allowAddRows: {
			control: 'boolean',
			description: 'Allow adding, deleting rows.',
		},
		editable: {
			control: 'boolean',
			description: 'Allow editing.',
		},
		keyColumn: {
			control: 'text',
			description:
				'The column that will be used as the key for each row.',
		},
		readonlyColumns: {
			control: 'object',
			description:
				'List of column names that are read-only / cannot be edited.',
		},
		columnPrecisions: {
			control: 'object',
			description:
				'Precision for number columns, used for formatting numbers. Defaults to 2 decimal places.',
		},
		columnTypes: {
			control: 'object',
			description:
				'Types of columns, used for formatting, cell rendering and validation. Defaults to string.',
		},
		defaultValues: {
			control: 'object',
			description:
				'Default values for columns, used when adding/reseting cells. Defaults to empty string for **ALL** columns.',
		},
		columnColors: {
			control: 'object',
			description:
				'Colors for columns, used for styling cells. Defaults to `defaultColumnColor`.',
		},
		defaultColumnColor: {
			control: 'color',
			description:
				'Default color for columns that do not have a specific color set.',
		},
		extraHeaderMenuItems: {
			control: 'object',
			description:
				'Extra menu items to add to the header context menu.',
		},
		overrideTypeToCellComponentTypeMap: {
			control: 'object',
			description:
				'Override the default cell component types for specific column types. You can use this to use custom components for specific column types.',
		},
	},
	args: {
		// Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
		// import { fn } from 'storybook/test';
		// onClick: fn(),
	},
} satisfies Meta<typeof Table<Data>>;
export default meta;

type Story = StoryObj<typeof meta>;

const mockData = (() => {
	const modelValue = {
		Key: ['Row 1', 'Row 2', 'Row 3'],
		'Longer Header': ['1', '2', '3'],
		Asd: ['4', '5', '6'],
	};

	return {
		modelValue,
		columns: Object.keys(modelValue),
		columnColors: {
			Asd: 'slateblue',
			'Longer Header': 'cornflowerblue',
		},
		readonlyColumns: ['Asd'],
		defaultValues: {
			Asd: '0',
			'Longer Header': '0.5',
			Key: '',
		},
	};
})();

export const Base: Story = {
	args: {
		...mockData,
		allowAddCols: true,
		allowAddRows: true,
		editable: true,
		// @ts-ignore
		keyColumn: 'Key',
		defaultColumnColor: '#88AACD',
	},
};
