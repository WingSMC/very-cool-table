export function blurActiveElement() {
	const active = document.activeElement;

	if (active instanceof HTMLElement) {
		active.blur();
		document.getSelection()?.removeAllRanges();
	}
}

export function clamp(
	value: number,
	min: number,
	max: number,
) {
	return Math.max(min, Math.min(max, value));
}

export function isEqual<T>(
	a: T,
	bIn: T,
): boolean {
	if (a === bIn) return true;
	if (typeof a !== typeof bIn) return false;
	if (typeof a !== 'object') return false;
	const b = bIn as typeof a;
	if (a === null || b === null) return false;

	const aKeys = Object.keys(a) as (keyof T)[];
	const bKeys = Object.keys(b) as (keyof T)[];
	if (aKeys.length !== bKeys.length) return false;

	for (const key of aKeys) {
		if (!(key in b)) return false;
		if (!isEqual(a[key], b[key])) return false;
	}

	return true;
}

export function calcUpscale(
	precision: number,
): number {
	return 10 ** precision;
}
export function roundToPrecision(
	value: string,
	upscale: number,
	defaultV: any,
): number {
	const v1 = parseFloat(value);
	if (isNaN(v1)) {
		return defaultV;
	}

	const v = Math.round(v1 * upscale) / upscale;
	if (v === Infinity || v === -Infinity) {
		return defaultV;
	}

	return v;
}
