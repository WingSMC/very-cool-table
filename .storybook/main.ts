import { StorybookConfig } from '@storybook/vue3-vite';

export default {
	stories: [
		'../src/**/*.mdx',
		'../src/**/*.stories.@(ts)',
	],
	addons: [
		'@storybook/addon-docs',
		'@storybook/addon-a11y',
		'@storybook/addon-vitest',
	],
	framework: {
		name: '@storybook/vue3-vite',
		options: {
			docgen: 'vue-component-meta',
		},
	},
} as StorybookConfig;
