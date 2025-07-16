export function blurActiveElement() {
	const active = document.activeElement;

	if (active instanceof HTMLElement) {
		active.blur();
		document.getSelection()?.removeAllRanges();
	}
}

export function getRootCSSProperyValue(
	property: string,
	or = 0,
): number {
	const body = document.body;
	const vstr = window
		.getComputedStyle(body)
		.getPropertyValue(property);
	return vstr ? getCSSExprPixelValue(vstr) : or;
}

function getCSSExprPixelValue(
	cssExpr: string,
): number {
	const temp = document.createElement('div');
	temp.style.marginTop = cssExpr;
	temp.style.position = 'absolute';
	temp.style.visibility = 'hidden';

	document.body.appendChild(temp);
	const pixels =
		window.getComputedStyle(temp).marginTop;
	document.body.removeChild(temp);

	return parseFloat(pixels);
}

export function range(
	min: number,
	max: number,
): Iterable<number> {
	return {
		*[Symbol.iterator]() {
			for (let i = min; i <= max; ++i) {
				yield i;
			}
		},
	};
}
