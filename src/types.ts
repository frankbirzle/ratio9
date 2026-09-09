export type Mode = "metronome" | "speed-training" | "ratios-training";

export type Subdivision =
	| "quarter" // 1/beat
	| "eighth" // 2/beat
	| "eighth-triplet" // 3/beat
	| "sixteenth" // 4/beat
	| "quintuplet" // 5/beat
	| "sextuplet" // 6/beat
	| "thirty-second"; // 8/beat

export type ClickTier = "accent" | "normal" | "subdivision";

export type SoundId =
	| "warm-woodblock"
	| "sharp-clave"
	| "cowbell"
	| "soft-chime"
	| "digital-beep"
	| "rim-shot"
	| "tabla"
	| "analog-click"
	| "super-click";

export type TimeSignaturePreset =
	| "2/4"
	| "3/4"
	| "4/4"
	| "5/4"
	| "6/8"
	| "7/8"
	| "12/8"
	| "custom";

export type CurveType = "linear" | "logarithmic" | "stepback" | "pyramid";

export interface TimeSignature {
	preset: TimeSignaturePreset;
	beatsPerBar: number;
	beatUnit: 4 | 8;
	accentGrouping?: number[]; // e.g., [2, 2, 3] for 7/8
}

export interface LoopConfig {
	subdivision: Subdivision;
	beats: number;
}

export interface DualLoopSettings {
	bpm: number;
	loop1: LoopConfig;
	loop2: LoopConfig;
	rounds: number;
	restBeats: number;
	initialCountIn: number;
	repeatCountIn: number;
	/**
	 * One extra click after the final loop, so a phrase that resolves onto the
	 * following downbeat has something to land on. A group of three played across
	 * two beats is seven notes, not six: the seventh is an elision, sharing the
	 * click that starts the next phase. Mid-session that click already exists (the
	 * first rest beat, or loop 2's first beat when there is no rest), so this only
	 * supplies the one the session end was missing.
	 */
	landingBeat: boolean;
	/**
	 * Keep the note count equal across both loops: loop 2's length is derived
	 * from loop 1 and the two subdivisions (2 beats of 8th triplets is 6 notes,
	 * so loop 2 gets 1 beat of sextuplets). Loop 1 then only steps in lengths
	 * that leave loop 2 a whole number of beats.
	 */
	linkLoops: boolean;
	/** Tempo ramp: after every full set of rounds, step the tempo up. */
	progressiveEnabled: boolean;
	progressiveStep: number;
	progressiveEndBpm: number;
	/**
	 * Start each tempo with the shortest linked phrase and grow loop 1 by one
	 * link-step per set of rounds until it reaches the configured length:
	 * 2:1, 4:2, 6:3, 8:4. Needs the loop link.
	 */
	buildUp: boolean;
}

export interface ProgressiveSettings {
	startBpm: number;
	endBpm: number;
	stepSize: number;
	barsPerStep: number;
	curve: CurveType;
	subdivision: Subdivision;
}

export interface SoundSettings {
	soundId: SoundId;
	volumeAccent: number; // 0–100
	volumeNormal: number; // 0–100
	volumeSubdivision: number; // 0–100
	subdivisionClicksOn: boolean;
}

export interface TimerSettings {
	durationSec: number | null; // null = free (no limit)
}

/**
 * What ends a session. Exactly one authority, so rounds and the timer can no
 * longer race each other.
 *
 * "rounds" means whatever the mode's own natural end is: ratios stops after N
 * rounds, speed stops when the ramp reaches its target, and the plain
 * metronome simply runs until stopped.
 */
export type LimitMode = "rounds" | "time";

export interface AppSettings {
	mode: Mode;
	limitMode: LimitMode;
	timeSignature: TimeSignature;
	sound: SoundSettings;
	timer: TimerSettings;
	dualLoop: DualLoopSettings;
	progressive: ProgressiveSettings;
	metronomeBpm: number;
	metronomeSubdivision: Subdivision;
}

export interface Preset {
	id: string;
	name: string;
	createdAt: number;
	settings: AppSettings;
}
