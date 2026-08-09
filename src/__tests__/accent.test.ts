import { describe, it, expect } from "vitest";
import { isPhaseAccent } from "../config";

/**
 * Walks a Ratios round the way useDualLoop does: beatInPhase resets to 0 at every
 * phase boundary, so the accent is asked for per phase, not per absolute beat.
 */
function accentsForRound(
	phases: { name: string; beats: number }[],
	beatsPerBar: number,
): string[] {
	const accented: string[] = [];
	for (const phase of phases) {
		for (let beatInPhase = 0; beatInPhase < phase.beats; beatInPhase++) {
			if (isPhaseAccent(beatInPhase, beatsPerBar)) {
				accented.push(`${phase.name}:${beatInPhase}`);
			}
		}
	}
	return accented;
}

describe("isPhaseAccent", () => {
	it("accents the first beat of a phase", () => {
		expect(isPhaseAccent(0, 4)).toBe(true);
	});

	it("accents every bar boundary within a phase", () => {
		expect(isPhaseAccent(4, 4)).toBe(true);
		expect(isPhaseAccent(8, 4)).toBe(true);
	});

	it("leaves the beats between bar boundaries unaccented", () => {
		expect(isPhaseAccent(1, 4)).toBe(false);
		expect(isPhaseAccent(2, 4)).toBe(false);
		expect(isPhaseAccent(3, 4)).toBe(false);
	});

	it("tolerates a zero beatsPerBar instead of dividing by it", () => {
		expect(isPhaseAccent(0, 0)).toBe(false);
	});

	it("marks the start of every phase when phases align with the bar", () => {
		const accents = accentsForRound(
			[
				{ name: "loop1", beats: 4 },
				{ name: "rest", beats: 4 },
				{ name: "loop2", beats: 4 },
			],
			4,
		);
		expect(accents).toEqual(["loop1:0", "rest:0", "loop2:0"]);
	});

	it("still marks the start of every phase when phases do not align", () => {
		// The drift case: loop1 = 3 beats and rest = 1 against a 4-beat bar. An
		// absolute beat count would put the next accent 4 beats in, mid-phrase.
		const accents = accentsForRound(
			[
				{ name: "loop1", beats: 3 },
				{ name: "rest", beats: 1 },
				{ name: "loop2", beats: 3 },
			],
			4,
		);
		expect(accents).toEqual(["loop1:0", "rest:0", "loop2:0"]);
	});

	it("gives the landing beat after loop1 its own accent", () => {
		// A 1-beat rest is the checkpoint the player lands on, so it must be accented.
		expect(isPhaseAccent(0, 4)).toBe(true);
	});
});
