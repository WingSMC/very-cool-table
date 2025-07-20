/// <reference types="vitest/config" />
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import path, { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import vueDevtools from 'vite-plugin-vue-devtools';

const dirname =
	typeof __dirname !== 'undefined'
		? __dirname
		: path.dirname(
				fileURLToPath(import.meta.url),
		  );

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
	plugins: [
		vue(),
		tailwindcss(),
		vueDevtools(),
		dts({
			rollupTypes: true,
			tsconfigPath: './tsconfig.app.json',
		}),
	],
	test: {
		projects: [
			{
				extends: true,
				plugins: [
					// The plugin will run tests for the stories defined in your Storybook config
					// See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
					storybookTest({
						configDir: path.join(
							dirname,
							'.storybook',
						),
					}),
				],
				test: {
					name: 'storybook',
					browser: {
						enabled: true,
						headless: true,
						provider: 'playwright',
						instances: [
							{
								browser: 'chromium',
							},
						],
					},
					setupFiles: [
						'.storybook/vitest.setup.ts',
					],
				},
			},
		],
	},
	build: {
		lib: {
			entry: resolve(__dirname, 'src/index.ts'),
			name: 'VeryCoolTable',
			fileName: 'index',
			formats: ['es'],
		},
		rollupOptions: {
			external: [
				'vue',
				'primevue',
				'@vueuse/core',
			],
		},
	},
});
