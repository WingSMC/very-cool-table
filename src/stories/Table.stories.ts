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
	argTypes: {},
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
		Asd: [1, 2, 3],
		Zxc: [3, 5, 2],
	};
	const columns = Object.keys(modelValue);
	const columnColors = {
		Asd: 'red',
		Zxc: 'cornflowerblue',
	};
	const readonlyColumns = ['ASD'];

	return {
		modelValue,
		columns,
		columnColors,
		readonlyColumns,
		defaultValues: {
			Asd: 0,
			Zxc: 0.5,
		},
	};
})();

export const Base: Story = {
	args: {
		allowAddCols: false,
		allowAddRows: false,
		// @ts-ignore
		keyColumn: 'Key',
		defaultColumnColor: '#88AACD',
		...mockData,
	},
};
