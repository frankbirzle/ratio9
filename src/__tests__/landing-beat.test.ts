import { describe, it, expect } from "vitest";
import { loop2Exit, getDefaultSettings } from "../config";

const base = { timed: false, round: 5, rounds: 5, landingBeat: true };

describe("loop2Exit", () => {
	it("cycles to the next round while rounds remain", () => {
		expect(loop2Exit({ ...base, round: 1 })).toBe("next-round");
		expect(loop2Exit({ ...base, round: 4 })).toBe("next-round");
	});

	it("gives the final phrase a landing beat when one is armed", () => {
		expect(loop2Exit(base)).toBe("landing");
	});

	it("stops straight off loop 2 when the landing beat is off", () => {
		expect(loop2Exit({ ...base, landingBeat: false })).toBe("complete");
	});

	it("never ends a timed session, whatever the round count says", () => {
		expect(loop2Exit({ ...base, timed: true })).toBe("next-round");
		expect(loop2Exit({ ...base, timed: true, round: 99 })).toBe("next-round");
		expect(loop2Exit({ ...base, timed: true, landingBeat: false })).toBe(
			"next-round",
		);
	});

	it("still stops when the round counter has overshot", () => {
		expect(loop2Exit({ ...base, round: 7, rounds: 5 })).toBe("landing");
	});

	it("is armed by default", () => {
		expect(getDefaultSettings().dualLoop.landingBeat).toBe(true);
	});
});
