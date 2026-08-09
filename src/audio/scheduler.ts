import {
	SCHEDULE_AHEAD_TIME,
	LOOKAHEAD_INTERVAL_MS,
	RESYNC_OFFSET,
} from "../config";

export interface SchedulerCallbacks {
	onScheduleBeat: (beatIndex: number, audioTime: number) => void;
	onScheduleSubdivision: (subIndex: number, audioTime: number) => void;
	onVisualBeat: (beatIndex: number) => void;
	getBpm: () => number;
	getNotesPerBeat: () => number;
	/** Called when the catch-up guard had to drop missed beats and resync. */
	onResync?: (totalSkippedBeats: number) => void;
}

export class MetronomeScheduler {
	private audioCtx: AudioContext;
	private callbacks: SchedulerCallbacks;
	private timerId: ReturnType<typeof setTimeout> | null = null;
	private nextNoteTime = 0;
	private beatCount = 0;
	private isPlaying = false;
	private skipped = 0;
	private visualTimers: ReturnType<typeof setTimeout>[] = [];

	constructor(audioCtx: AudioContext, callbacks: SchedulerCallbacks) {
		this.audioCtx = audioCtx;
		this.callbacks = callbacks;
	}

	start(): void {
		this.isPlaying = true;
		this.beatCount = 0;
		this.skipped = 0;
		this.nextNoteTime = this.audioCtx.currentTime + 0.05;
		this.scheduler();
	}

	stop(): void {
		this.isPlaying = false;
		if (this.timerId) {
			clearTimeout(this.timerId);
			this.timerId = null;
		}
		this.visualTimers.forEach((id) => clearTimeout(id));
		this.visualTimers = [];
	}

	get running(): boolean {
		return this.isPlaying;
	}

	/** Beats dropped by the catch-up guard since start(). */
	get skippedBeats(): number {
		return this.skipped;
	}

	private scheduler = (): void => {
		if (!this.isPlaying) return;
		// Catch-up guard: the lookahead timer is a setTimeout, so it stalls when the
		// tab is backgrounded or the main thread blocks, while audioCtx.currentTime
		// keeps advancing. Without this, nextNoteTime falls behind currentTime and the
		// while loop below schedules every missed beat at once with timestamps in the
		// past — Web Audio fires those immediately, so the whole drill burns through
		// its phases in one burst. Drop the missed beats and resync to now instead.
		if (this.nextNoteTime < this.audioCtx.currentTime) {
			const bpm = this.callbacks.getBpm();
			const behind = this.audioCtx.currentTime - this.nextNoteTime;
			this.skipped += Math.ceil(behind / (60.0 / bpm));
			this.nextNoteTime = this.audioCtx.currentTime + RESYNC_OFFSET;
			this.callbacks.onResync?.(this.skipped);
		}
		// Fix R2.3: re-check isPlaying inside the while loop
		while (
			this.isPlaying &&
			this.nextNoteTime < this.audioCtx.currentTime + SCHEDULE_AHEAD_TIME
		) {
			this.scheduleBeat(this.beatCount, this.nextNoteTime);
			const bpm = this.callbacks.getBpm();
			this.nextNoteTime += 60.0 / bpm;
			this.beatCount++;
		}
		if (this.isPlaying) {
			this.timerId = setTimeout(this.scheduler, LOOKAHEAD_INTERVAL_MS);
		}
	};

	private scheduleBeat(beatIndex: number, time: number): void {
		// Fix 6: Schedule subdivisions BEFORE onScheduleBeat (which may advance phase)
		const notesPerBeat = this.callbacks.getNotesPerBeat();
		if (notesPerBeat > 1) {
			const bpm = this.callbacks.getBpm();
			const subInterval = 60.0 / bpm / notesPerBeat;
			for (let s = 1; s < notesPerBeat; s++) {
				this.callbacks.onScheduleSubdivision(s, time + s * subInterval);
			}
		}
		// Then call onScheduleBeat (which may mutate phase/state)
		this.callbacks.onScheduleBeat(beatIndex, time);
		// Visual beat
		const delay = Math.max(0, (time - this.audioCtx.currentTime) * 1000);
		const id = setTimeout(() => {
			if (this.isPlaying) this.callbacks.onVisualBeat(beatIndex);
		}, delay);
		this.visualTimers.push(id);
	}
}
