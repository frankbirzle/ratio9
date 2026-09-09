import { SUBDIVISIONS, BPM_MAX } from "./config";
import type { DualLoopSettings, Subdivision } from "./types";

export const LOOP_BEATS_MAX = 16;

function notesPerBeat(sub: Subdivision): number {
	return SUBDIVISIONS.find((s) => s.id === sub)?.notesPerBeat ?? 1;
}

function gcd(a: number, b: number): number {
	return b ? gcd(b, a % b) : a;
}

/**
 * Smallest loop-1 length (in beats) that gives loop 2 a whole number of beats
 * at equal note count. Triplets against sextuplets: 2. 8ths against triplets: 3.
 */
export function loop1Step(n1: number, n2: number): number {
	return n2 / gcd(n1, n2);
}

/** Loop 2 length that plays exactly as many notes as loop 1. */
export function linkedLoop2Beats(
	loop1Beats: number,
	n1: number,
	n2: number,
): number {
	return (loop1Beats * n1) / n2;
}

/**
 * Enforce the loop link at write time, so every reader of `loop2.beats` keeps
 * seeing a plain number. Loop 1 is snapped up to the next valid length so the
 * derived loop 2 is whole.
 */
export function applyLoopLink(dl: DualLoopSettings): DualLoopSettings {
	if (!dl.linkLoops) return dl;
	const n1 = notesPerBeat(dl.loop1.subdivision);
	const n2 = notesPerBeat(dl.loop2.subdivision);
	const step = loop1Step(n1, n2);
	let beats1 = Math.ceil(Math.max(1, dl.loop1.beats) / step) * step;
	if (beats1 > LOOP_BEATS_MAX) beats1 = Math.floor(LOOP_BEATS_MAX / step) * step;
	const beats2 = linkedLoop2Beats(beats1, n1, n2);
	if (beats1 === dl.loop1.beats && beats2 === dl.loop2.beats) return dl;
	return {
		...dl,
		loop1: { ...dl.loop1, beats: beats1 },
		loop2: { ...dl.loop2, beats: beats2 },
	};
}

/** Loop-1 lengths played in turn when the phrase is built up. */
export function buildUpStages(dl: DualLoopSettings): number[] {
	if (!dl.buildUp || !dl.linkLoops) return [dl.loop1.beats];
	const step = loop1Step(
		notesPerBeat(dl.loop1.subdivision),
		notesPerBeat(dl.loop2.subdivision),
	);
	const out: number[] = [];
	for (let b = step; b <= dl.loop1.beats; b += step) out.push(b);
	return out.length ? out : [dl.loop1.beats];
}

/** One set: the configured rounds at one tempo and one phrase length. */
export interface RatioSet {
	bpm: number;
	loop1Beats: number;
	loop2Beats: number;
}

/**
 * The whole session as a list of sets. Every stage plays at one tempo before
 * the tempo steps up, so 60: 2:1, 4:2, 6:3, 8:4, then 62: 2:1, ... The ramp
 * never overshoots the end tempo, and an end tempo below the start is treated
 * as no ramp.
 */
export function ratioSets(dl: DualLoopSettings): RatioSet[] {
	const n1 = notesPerBeat(dl.loop1.subdivision);
	const n2 = notesPerBeat(dl.loop2.subdivision);
	const stages = buildUpStages(dl);
	const tempos: number[] = [dl.bpm];
	if (dl.progressiveEnabled) {
		const step = Math.max(1, dl.progressiveStep);
		const end = Math.min(BPM_MAX, dl.progressiveEndBpm);
		for (let b = dl.bpm + step; b <= end; b += step) tempos.push(b);
	}
	const sets: RatioSet[] = [];
	for (const bpm of tempos) {
		for (const loop1Beats of stages) {
			sets.push({
				bpm,
				loop1Beats,
				loop2Beats: dl.linkLoops
					? linkedLoop2Beats(loop1Beats, n1, n2)
					: dl.loop2.beats,
			});
		}
	}
	return sets;
}

export function nextSet(sets: RatioSet[], index: number): RatioSet | null {
	return sets[index + 1] ?? null;
}
