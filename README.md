# Just a nice table with excel-like copy/paste functionality

You can play with the component and it's props here: [very-cool-table storybook](https://wingsmc.github.io/very-cool-table/)

- Some hotkeys and the selection is buggy in the storybook because of **storybook's own** keybindings.

## Installation

```sh
npm i very-cool-table @vueuse/core primevue vue
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
@import 'very-cool-table/style.css';
@import 'primeicons/primeicons.css';
```

```js
import 'very-cool-table/style.css';
import 'primeicons/primeicons.css';
```

## Use

Then you can use the `<Table>` component in your templates:

```html
<script
	setup
	lang="ts"
>
	import { Table } from 'very-cool-table';

	const table = ref({
		'Column 1': ['Row 1', 'Row 2', 'Row 3'],
		'Column 2': ['Row 1', 'Row 2', 'Row 3'],
		'Column 3': ['Row 1', 'Row 2', 'Row 3'],
	});
	// This is also bound to a model because it can be reordered
	// and columns can be added/removed
	const columns = ref(Object.keys(table.value));
</script>

<template>
	<table
		v-model="table"
		v-model:columns="columns"
	/>
</template>
```

## Hotkeys

Some of these are available in the context menu by default.

Columns can also be selected by clicking the header.

- **any text/number** / **double click**: edit selected cell (when multiple cells are selected the last one to be selected is edited, this applies to most operations that work on a single cell)
- <kbd>Enter</kbd> / <kbd>↓</kbd>: for most cells, move to the next cell below, in multiline cells enter inserts a new line
- <kbd>Shift</kbd> + <kbd>Enter</kbd> / <kbd>↑</kbd>: move to the previous cell above
- <kbd>Tab</kbd> / <kbd>→</kbd>: move to the next cell to the right
- <kbd>Shift</kbd> + <kbd>Tab</kbd> / <kbd>←</kbd>: move to the previous cell to the left
- <kbd>Ctrl</kbd> + <kbd>C</kbd>: copy selected cells
- <kbd>Ctrl</kbd> + <kbd>V</kbd>: paste copied cells, pasting can add rows to the table if the pasted data has more rows than the current size and `allowAddRows` prop is true.
- <kbd>Ctrl</kbd> + <kbd>←</kbd>: move column left
- <kbd>Ctrl</kbd> + <kbd>→</kbd>: move column right
- <kbd>Ctrl</kbd> + <kbd>A</kbd>: select all cells
- <kbd>Ctrl</kbd> + <kbd>Space</kbd>: select row
- <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Space</kbd>: select column
- <kbd>Ctrl</kbd> + <kbd>Enter</kbd>: add row below
- <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Enter</kbd>: add column to the right
- <kbd>Ctrl</kbd> + <kbd>Delete</kbd>: delete selected rows
- <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Delete</kbd>: delete selected columns
- <kbd>Shift</kbd> + (<kbd>↑</kbd> / <kbd>↓</kbd> / <kbd>←</kbd> / <kbd>→</kbd>): extend selection in the direction of the arrow
- <kbd>Alt</kbd> + (<kbd>↑</kbd> / <kbd>↓</kbd> / <kbd>←</kbd> / <kbd>→</kbd>): move multi-selection
- Move single selection, jumps to next/previous line/column when at the end of the current line/column:
  - <kbd>Tab</kbd> / <kbd>→</kbd>
  - <kbd>Shift</kbd> + <kbd>Tab</kbd> / <kbd>←</kbd>
  - <kbd>Enter</kbd> / <kbd>↓</kbd>: Enter doesn't move when editing a multiline cell.
  - <kbd>Shift</kbd> + <kbd>Enter</kbd> / <kbd>↑</kbd>
- <kbd>Esc</kbd>: exit editing or multi-selection mode
- <kbd>Delete</kbd>: reset selected cells to their default values
- <kbd>Alt</kbd> + <kbd>R</kbd>: rename column

## Tips

- You can provide `Proxy` objects for column mapper props (e.g. `columnTypes`, `defaultColumnValues`) so you can do more advanced name matching. e.g:

```ts
const columnColors = new Proxy(
	{}, // empty target because it's mandatory
	{
		// prop is the column name
		get: (_target, prop) => {
			if (/important/i.test(prop)) {
				return '#ff5577'; // redish
			}
			if (/optional/i.test(prop))) {
				return '#50c0c0'; // very relaxing light green color
			}
			return 'rgb(0 0 0)'; // black
		},
	},
);
```

- To implement custom cells refer to the various cell components like `NumberCell` in the source code and use the `columnToCellComponentTypeMap` prop and `overrideTypeToCellComponentTypeMap` table prop to add or override types mapped by the `columnTypes` prop.
  - You can also `inject` the `OPERATIONS_SERVICE`, `KEY_COLUMN` and the `SELECTION_SERVICE` into your custom cell components to access the table operations and selection features.
  - Cells recieve the following props:
    - `colName`: the name of the column
    - `col`: the column index in the columns array
    - `row`: the row index
    - `value`: the value of the cell (= `table[colName][row]`)
    - `readonly`: whether the cell is readonly (from the `readonlyColumns` prop)
    - `editing`: whether the cell is selected for editing
    - `defaultValue`: the default value for the cell (from the `defaultColumnValues` and `defaultColumnValue` props)
    - `precision`: the precision for number cells (from the `columnPrecisions` and `defaultColumnPrecision` props)
- The table exposes the above services too so you can control the table programmatically from a parent component through a `useTemplateRef` or something similar.
- Play with the component in the [storybook](https://wingsmc.github.io/very-cool-table/) to see all the props and features available.

## Development

**PRs and requests are welcome!**
