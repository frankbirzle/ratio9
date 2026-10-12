/** BPM change per pixel of drag: about 7px per BPM, so one BPM is easy to hit. */
export const KNOB_BPM_PER_PX = 0.15;

/** Even numbers catch the drag within this distance (a 1.2 BPM zone). */
const EVEN_SNAP = 0.6;

/**
 * Turns a raw, fractional drag value into a BPM. Evens get a slightly wider
 * zone than odds, so the drag settles on them but every odd value stays
 * reachable.
 */
export function snapBpm(raw: number): number {
	const even = 2 * Math.round(raw / 2);
	return Math.abs(raw - even) <= EVEN_SNAP ? even : Math.round(raw);
}
