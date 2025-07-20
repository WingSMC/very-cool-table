# Just a nice table with excel-like copy/paste functionality

## Installation

```sh
npm i @wingsmc/very-cool-table @vueuse/core primevue vue
# optional
npm i primeicons
```

## Setup

Add these to your vue app:

```ts
// Provide the PrimeVue plugin to your Vue app
app.use(PrimeVue, {
	/* whatever you like */
});
```

Optionally add this to your css or main.js/ts:

```css
@import '@wingsmc/very-cool-table/very-cool-table.css';
@import 'primeicons/primeicons.css';
```

```js
import '@wingsmc/very-cool-table/very-cool-table.css';
import 'primeicons/primeicons.css';
```

## Use

Then you can use the `<Table>` component in your templates:

```html
<script
	setup
	lang="ts"
>
	import { Table } from '@wingsmc/very-cool-table';

	const table = ref({
		'Column 1': ['Row 1', 'Row 2', 'Row 3'],
		'Column 2': ['Row 1', 'Row 2', 'Row 3'],
		'Column 3': ['Row 1', 'Row 2', 'Row 3'],
	});
	const columns = ref([
		'Column 1',
		'Column 2',
		'Column 3',
	]);
</script>

<template>
	<table
		v-model="table"
		v-model:columns="columns"
	/>
</template>
```

## Tips

- You can provide `Proxy` objects for column mapper props (e.g. `columnTypes`, `defaultColumnValues`) so you can do more advanced name matching.

## Development

**PRs and requests are welcome!**
