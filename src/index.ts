export * from './components';

import type { App } from 'vue';
import * as components from './components';
export default {
	install(app: App) {
		const cs = Object.values(components);
		for (const c of cs) {
			app.component(c.name, c);
		}
	},
};
