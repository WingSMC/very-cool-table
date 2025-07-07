import type {
	Meta,
	StoryObj,
} from '@storybook/vue3-vite';
import Table from '../components/Table.vue';

const meta = {
	title: 'Table',
	component: Table,
	tags: ['autodocs'],
	argTypes: {},
	args: {
		// Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
		// import { fn } from 'storybook/test';
		// onClick: fn(),
	},
} satisfies Meta<typeof Table>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Base: Story = {
	args: {
		allowAddCols: false,
		allowAddRows: false,
	},
};

export const AddColumns: Story = {
	args: {
		allowAddCols: true,
		allowAddRows: false,
	},
};

export const AddRows: Story = {
	args: {
		allowAddCols: false,
		allowAddRows: true,
	},
};
