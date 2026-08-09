import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { MetronomeScheduler, type SchedulerCallbacks } from "../scheduler";
import { LOOKAHEAD_INTERVAL_MS } from "../../config";

/**
 * Minimal AudioContext stand-in. currentTime only moves when a test moves it, so a
 * test can advance audio time without advancing timers, which is exactly what a
 * throttled background tab or a stalled main thread does to the lookahead loop.
 */
class FakeAudioContext {
	currentTime = 0;
}

interface ScheduledBeat {
	beatIndex: number;
	audioTime: number;
	/** currentTime at the moment the beat was handed to the audio layer. */
	scheduledAt: number;
}

function setup(bpm = 120) {
	const ctx = new FakeAudioContext();
	const beats: ScheduledBeat[] = [];
	const resyncs: number[] = [];
	const callbacks: SchedulerCallbacks = {
		onScheduleBeat: (beatIndex, audioTime) =>
			beats.push({ beatIndex, audioTime, scheduledAt: ctx.currentTime }),
		onScheduleSubdivision: () => {},
		onVisualBeat: () => {},
		getBpm: () => bpm,
		getNotesPerBeat: () => 1,
		onResync: (skipped) => resyncs.push(skipped),
	};
	const scheduler = new MetronomeScheduler(
		ctx as unknown as AudioContext,
		callbacks,
	);
	/** Advance audio time and timers together, the way real playback runs. */
	const run = (ms: number) => {
		const steps = Math.round(ms / LOOKAHEAD_INTERVAL_MS);
		for (let i = 0; i < steps; i++) {
			ctx.currentTime += LOOKAHEAD_INTERVAL_MS / 1000;
			vi.advanceTimersByTime(LOOKAHEAD_INTERVAL_MS);
		}
	};
	/** Audio time jumps forward while the lookahead timer stays starved. */
	const stall = (seconds: number) => {
		ctx.currentTime += seconds;
	};
	return { ctx, beats, resyncs, scheduler, run, stall };
}

describe("MetronomeScheduler", () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it("schedules beats on the grid during normal playback", () => {
		const { beats, scheduler, run } = setup(120);
		scheduler.start();
		run(2000);

		// 2s at 120bpm is 4 beats, plus the 5th already queued inside the lookahead.
		expect(beats.length).toBe(5);
		// 0.5s spacing at 120bpm, starting 0.05s after start()
		beats.forEach((beat, i) => {
			expect(beat.audioTime).toBeCloseTo(0.05 + i * 0.5, 6);
		});
		expect(scheduler.skippedBeats).toBe(0);
	});

	it("never schedules a beat in the past", () => {
		const { beats, scheduler, run, stall } = setup(120);
		scheduler.start();
		run(500);
		stall(20);
		run(LOOKAHEAD_INTERVAL_MS);

		for (const beat of beats) {
			expect(beat.audioTime).toBeGreaterThanOrEqual(beat.scheduledAt);
		}
	});

	it("drops missed beats instead of firing them as a burst", () => {
		const { beats, scheduler, run, stall } = setup(120);
		scheduler.start();
		run(500);
		const beforeStall = beats.length;

		stall(20); // 20s starved = 40 beats' worth at 120bpm
		run(LOOKAHEAD_INTERVAL_MS);

		// Without the catch-up guard this single tick scheduled all ~40 missed beats.
		const scheduledOnResumeTick = beats.length - beforeStall;
		expect(scheduledOnResumeTick).toBeLessThanOrEqual(2);
		// 20s of 120bpm is 40 beats, less the lead the scheduler already had queued.
		expect(scheduler.skippedBeats).toBeGreaterThanOrEqual(39);
		expect(scheduler.skippedBeats).toBeLessThanOrEqual(40);
	});

	it("reports the resync once per stall, not per tick", () => {
		const { scheduler, resyncs, run, stall } = setup(120);
		scheduler.start();
		run(500);

		stall(20);
		run(500); // many ticks after the stall

		expect(resyncs.length).toBe(1);
		expect(resyncs[0]).toBeGreaterThanOrEqual(39);
	});

	it("resumes on the grid after a stall", () => {
		const { beats, scheduler, run, stall } = setup(120);
		scheduler.start();
		run(500);
		stall(20);
		run(2000);

		const afterStall = beats.filter((b) => b.scheduledAt >= 20);
		expect(afterStall.length).toBeGreaterThanOrEqual(3);
		for (let i = 1; i < afterStall.length; i++) {
			expect(afterStall[i].audioTime - afterStall[i - 1].audioTime).toBeCloseTo(
				0.5,
				6,
			);
		}
	});

	it("counts skipped beats at the current tempo", () => {
		const { scheduler, run, stall } = setup(60); // 1 beat per second
		scheduler.start();
		run(500);
		stall(10);
		run(LOOKAHEAD_INTERVAL_MS);

		// 10s at 60bpm is 10 beats, less the lead already queued.
		expect(scheduler.skippedBeats).toBeGreaterThanOrEqual(9);
		expect(scheduler.skippedBeats).toBeLessThanOrEqual(10);
	});

	it("stops scheduling after stop()", () => {
		const { beats, scheduler, run } = setup(120);
		scheduler.start();
		run(500);
		const atStop = beats.length;
		scheduler.stop();
		run(2000);

		expect(beats.length).toBe(atStop);
		expect(scheduler.running).toBe(false);
	});

	it("clears the skip counter on restart", () => {
		const { scheduler, run, stall } = setup(120);
		scheduler.start();
		stall(20);
		run(LOOKAHEAD_INTERVAL_MS);
		expect(scheduler.skippedBeats).toBeGreaterThan(0);

		scheduler.stop();
		scheduler.start();
		expect(scheduler.skippedBeats).toBe(0);
	});
});
