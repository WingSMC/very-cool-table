import type {
	Meta,
	StoryObj,
} from '@storybook/vue3-vite';
import Table from '../components/Table.vue';

type Data = Record<string, string[]>;

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
		defaultColumnValues: {
			Asd: '0',
			'Longer Header': '0.5',
			Key: '',
		},
	};
})();

export const Base: Story = {
	args: {
		...mockData,
	},
};

export const Empty: Story = {
	args: {
		columns: [],
		modelValue: {},
	},
};
