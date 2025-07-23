import type {
	Meta,
	StoryObj,
} from '@storybook/vue3-vite';
import Table from '../components/Table.vue';
import { ColumnTypeEnum } from '../types';

const meta: Meta<typeof Table> = {
	title: 'Table',
	component: Table,
	tags: ['autodocs'],
	parameters: {
		layout: 'padded',
		docs: {
			description: {
				component:
					'A table component for displaying and editing data.',
			},
		},
		chromatic: {
			delay: 1000,
			viewports: [768, 1024, 1440, 1920],
		},
	},
	args: {
		// Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
		// import { fn } from 'storybook/test';
		// onClick: fn(),
	},
};
export default meta;

type Story = StoryObj<typeof meta>;

const mockData = (() => {
	const modelValue = {
		A: ['Row 1', 'Row 2', 'Row 3'],
		B: ['1', '2', '3'],
		numbers: [4, 5, 6],
	};

	return {
		modelValue,
		columns: Object.keys(modelValue),
		columnColors: {
			numbers: 'slateblue',
		},
		readonlyColumns: ['A'],
		defaultColumnValues: {
			numbers: 0,
		},
		columnTypes: {
			numbers: ColumnTypeEnum.Number,
		},
	};
})();

export const Base: Story = {
	args: mockData,
};

export const Empty: Story = {
	args: {
		modelValue: {},
		columns: [],
	},
};
