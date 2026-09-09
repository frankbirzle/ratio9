import { describe, it, expect } from "vitest";
import { getDefaultSettings, loop2Exit } from "../config";
import {
	loop1Step,
	linkedLoop2Beats,
	applyLoopLink,
	buildUpStages,
	ratioSets,
	nextSet,
} from "../ratioPlan";
import type { DualLoopSettings } from "../types";

const dl = (patch: Partial<DualLoopSettings> = {}): DualLoopSettings => ({
	...getDefaultSettings().dualLoop,
	...patch,
});

describe("loop link", () => {
	it("steps loop 1 so that loop 2 stays a whole number of beats", () => {
		expect(loop1Step(3, 6)).toBe(2); // triplets vs sextuplets
		expect(loop1Step(2, 4)).toBe(2); // 8ths vs 16ths
		expect(loop1Step(2, 3)).toBe(3); // 8ths vs triplets
		expect(loop1Step(4, 4)).toBe(1); // same subdivision
		expect(loop1Step(6, 3)).toBe(1); // loop 2 slower than loop 1
	});

	it("keeps the note count equal across both loops", () => {
		expect(linkedLoop2Beats(2, 3, 6)).toBe(1);
		expect(linkedLoop2Beats(8, 3, 6)).toBe(4);
		expect(linkedLoop2Beats(3, 2, 3)).toBe(2);
		expect(linkedLoop2Beats(2, 6, 3)).toBe(4);
	});

	it("derives loop 2 from loop 1 when linked", () => {
		const out = applyLoopLink(
			dl({ loop1: { subdivision: "eighth-triplet", beats: 4 }, loop2: { subdivision: "sextuplet", beats: 4 } }),
		);
		expect(out.loop2.beats).toBe(2);
		expect(out.loop1.beats).toBe(4);
	});

	it("snaps loop 1 up to the next valid length when it does not divide", () => {
		const out = applyLoopLink(
			dl({ loop1: { subdivision: "eighth-triplet", beats: 3 }, loop2: { subdivision: "sextuplet", beats: 1 } }),
		);
		expect(out.loop1.beats).toBe(4);
		expect(out.loop2.beats).toBe(2);
	});

	it("leaves everything alone when the link is off", () => {
		const input = dl({
			linkLoops: false,
			loop1: { subdivision: "eighth-triplet", beats: 3 },
			loop2: { subdivision: "sextuplet", beats: 5 },
		});
		expect(applyLoopLink(input)).toBe(input);
	});

	it("is on by default", () => {
		expect(getDefaultSettings().dualLoop.linkLoops).toBe(true);
		const d = applyLoopLink(getDefaultSettings().dualLoop);
		expect(d.loop2.beats).toBe(d.loop1.beats / 2);
	});
});

describe("build-up stages", () => {
	it("grows loop 1 one link-step at a time up to the configured length", () => {
		expect(buildUpStages(dl({ buildUp: true, loop1: { subdivision: "eighth-triplet", beats: 8 } }))).toEqual([2, 4, 6, 8]);
		expect(buildUpStages(dl({ buildUp: true, loop1: { subdivision: "eighth", beats: 9 }, loop2: { subdivision: "eighth-triplet", beats: 6 } }))).toEqual([3, 6, 9]);
	});

	it("is a single stage when build-up is off or the link is off", () => {
		expect(buildUpStages(dl({ buildUp: false, loop1: { subdivision: "eighth-triplet", beats: 8 } }))).toEqual([8]);
		expect(buildUpStages(dl({ buildUp: true, linkLoops: false, loop1: { subdivision: "eighth-triplet", beats: 8 } }))).toEqual([8]);
	});
});

describe("ratio sets", () => {
	const both = dl({
		bpm: 60,
		progressiveEnabled: true,
		progressiveStep: 2,
		progressiveEndBpm: 64,
		buildUp: true,
		linkLoops: true,
		loop1: { subdivision: "eighth-triplet", beats: 8 },
		loop2: { subdivision: "sextuplet", beats: 4 },
	});

	it("runs every stage at one tempo before stepping the tempo", () => {
		expect(ratioSets(both)).toEqual([
			{ bpm: 60, loop1Beats: 2, loop2Beats: 1 },
			{ bpm: 60, loop1Beats: 4, loop2Beats: 2 },
			{ bpm: 60, loop1Beats: 6, loop2Beats: 3 },
			{ bpm: 60, loop1Beats: 8, loop2Beats: 4 },
			{ bpm: 62, loop1Beats: 2, loop2Beats: 1 },
			{ bpm: 62, loop1Beats: 4, loop2Beats: 2 },
			{ bpm: 62, loop1Beats: 6, loop2Beats: 3 },
			{ bpm: 62, loop1Beats: 8, loop2Beats: 4 },
			{ bpm: 64, loop1Beats: 2, loop2Beats: 1 },
			{ bpm: 64, loop1Beats: 4, loop2Beats: 2 },
			{ bpm: 64, loop1Beats: 6, loop2Beats: 3 },
			{ bpm: 64, loop1Beats: 8, loop2Beats: 4 },
		]);
	});

	it("never overshoots the end tempo", () => {
		const sets = ratioSets(dl({ ...both, buildUp: false, progressiveStep: 3, progressiveEndBpm: 65 }));
		expect(sets.map((s) => s.bpm)).toEqual([60, 63]);
	});

	it("is one plain set when neither ramp nor build-up is on", () => {
		expect(ratioSets(dl({ bpm: 100 }))).toEqual([{ bpm: 100, loop1Beats: 4, loop2Beats: 2 }]);
	});

	it("ignores an end tempo below the start tempo", () => {
		expect(ratioSets(dl({ ...both, buildUp: false, progressiveEndBpm: 50 })).map((s) => s.bpm)).toEqual([60]);
	});

	it("hands out the following set and null at the end", () => {
		const sets = ratioSets(both);
		expect(nextSet(sets, 0)).toEqual(sets[1]);
		expect(nextSet(sets, sets.length - 1)).toBeNull();
	});
});

describe("loop2Exit with sets", () => {
	const base = { timed: false, round: 4, rounds: 4, landingBeat: true, hasNextSet: false };

	it("moves to the next set once the rounds of this set are done", () => {
		expect(loop2Exit({ ...base, hasNextSet: true })).toBe("next-set");
		expect(loop2Exit({ ...base, round: 2, hasNextSet: true })).toBe("next-round");
	});

	it("lands or completes only after the last set", () => {
		expect(loop2Exit(base)).toBe("landing");
		expect(loop2Exit({ ...base, landingBeat: false })).toBe("complete");
	});

	it("still advances sets in a timed session but never ends it", () => {
		expect(loop2Exit({ ...base, timed: true, hasNextSet: true })).toBe("next-set");
		expect(loop2Exit({ ...base, timed: true })).toBe("next-round");
	});
});
