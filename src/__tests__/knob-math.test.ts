import { describe, it, expect } from "vitest";
import { snapBpm } from "../knobMath";

describe("snapBpm", () => {
	it("leaves whole numbers alone", () => {
		expect(snapBpm(60)).toBe(60);
		expect(snapBpm(61)).toBe(61);
	});

	it("pulls values near an even number onto it", () => {
		expect(snapBpm(60.5)).toBe(60);
		expect(snapBpm(59.5)).toBe(60);
		expect(snapBpm(60.55)).toBe(60);
	});

	it("still reaches every odd number", () => {
		expect(snapBpm(61)).toBe(61);
		expect(snapBpm(60.8)).toBe(61);
		expect(snapBpm(61.2)).toBe(61);
	});

	it("walks through every integer on a slow drag", () => {
		const seen = new Set<number>();
		for (let raw = 60; raw <= 70; raw += 0.05) seen.add(snapBpm(raw));
		for (let n = 60; n <= 70; n++) expect(seen.has(n)).toBe(true);
	});
});
