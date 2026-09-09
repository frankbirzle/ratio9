import type {
	Subdivision,
	TimeSignaturePreset,
	SoundId,
	AppSettings,
} from "./types";

export const BPM_MIN = 20;
export const BPM_MAX = 320;
export const SCHEDULE_AHEAD_TIME = 0.1; // seconds
export const LOOKAHEAD_INTERVAL_MS = 25; // ms
export const RESYNC_OFFSET = 0.02; // seconds — where the catch-up guard restarts the grid
export const NOTE_DURATION = 0.04; // seconds (40ms)

export const STORAGE_KEY_SETTINGS = "gst:settings";
export const STORAGE_KEY_PRESETS = "gst:presets";
export const MAX_PRESETS = 50;
export const SAVE_DEBOUNCE_MS = 500;

// No "∞" entry: an unlimited session is now the "rounds" side of the session-end
// control, not a timer value.
export const TIMER_PRESETS_SEC = [
	{ label: "1m", value: 60 },
	{ label: "2m", value: 120 },
	{ label: "3m", value: 180 },
	{ label: "5m", value: 300 },
	{ label: "10m", value: 600 },
	{ label: "15m", value: 900 },
];

export const SUBDIVISIONS: {
	id: Subdivision;
	label: string;
	notesPerBeat: number;
}[] = [
	{ id: "quarter", label: "Quarter", notesPerBeat: 1 },
	{ id: "eighth", label: "8th", notesPerBeat: 2 },
	{ id: "eighth-triplet", label: "8th Triplets", notesPerBeat: 3 },
	{ id: "sixteenth", label: "16th", notesPerBeat: 4 },
	{ id: "quintuplet", label: "Quintuplet", notesPerBeat: 5 },
	{ id: "sextuplet", label: "Sextuplets", notesPerBeat: 6 },
	{ id: "thirty-second", label: "32nd", notesPerBeat: 8 },
];

export const TIME_SIGNATURES: {
	preset: TimeSignaturePreset;
	beatsPerBar: number;
	beatUnit: 4 | 8;
	defaultAccent?: number[];
}[] = [
	{ preset: "2/4", beatsPerBar: 2, beatUnit: 4 },
	{ preset: "3/4", beatsPerBar: 3, beatUnit: 4 },
	{ preset: "4/4", beatsPerBar: 4, beatUnit: 4 },
	{ preset: "5/4", beatsPerBar: 5, beatUnit: 4, defaultAccent: [3, 2] },
	{ preset: "6/8", beatsPerBar: 6, beatUnit: 8, defaultAccent: [3, 3] },
	{ preset: "7/8", beatsPerBar: 7, beatUnit: 8, defaultAccent: [2, 2, 3] },
	{ preset: "12/8", beatsPerBar: 12, beatUnit: 8, defaultAccent: [3, 3, 3, 3] },
];

export const SOUND_OPTIONS: {
	id: SoundId;
	label: string;
	description: string;
}[] = [
	{
		id: "super-click",
		label: "Super Click",
		description: "Sharp digital beep, three pitches — default",
	},
	{
		id: "warm-woodblock",
		label: "Warm Woodblock",
		description: "Warm organic knock",
	},
	{
		id: "sharp-clave",
		label: "Sharp Clave",
		description: "Bright, penetrating — for loud guitar",
	},
	{
		id: "cowbell",
		label: "Cowbell",
		description: "Metallic, cutting — rock/metal",
	},
	{
		id: "soft-chime",
		label: "Soft Chime",
		description: "String-like, musical — unique",
	},
	{
		id: "digital-beep",
		label: "Digital Beep",
		description: "Pure, clean, gentle",
	},
	{
		id: "rim-shot",
		label: "Rim Shot",
		description: "Acoustic, dry, natural (CC0 sample)",
	},
	{
		id: "tabla",
		label: "Tabla",
		description: "Warm, complex, exotic (CC0/CC-BY sample)",
	},
	{
		id: "analog-click",
		label: "Analog Click",
		description: "Warm, vintage, fuzzy",
	},
];

export function getSubdivisionsForMeter(beatUnit: 4 | 8): typeof SUBDIVISIONS {
	if (beatUnit === 8) {
		// Compound meter: 8th is the beat, so 8th-triplets don't exist
		return SUBDIVISIONS.filter(
			(s) =>
				s.id !== "eighth-triplet" && s.id !== "eighth" && s.id !== "quarter",
		);
	}
	return SUBDIVISIONS;
}

export function notesPerSecond(bpm: number, notesPerBeat: number): number {
	return (bpm * notesPerBeat) / 60;
}

/**
 * Accent falls on the first beat of a phase and on every bar boundary within it.
 * Takes the beat's index *within its phase*, never an absolute beat count: phases
 * (count-in, loop1, rest, loop2) can be any length, so an absolute count puts the
 * accent in the middle of the phrase as soon as a phase length is not a multiple
 * of beatsPerBar.
 */
export function isPhaseAccent(
	beatInPhase: number,
	beatsPerBar: number,
): boolean {
	return beatsPerBar > 0 && beatInPhase % beatsPerBar === 0;
}

/** What follows the last beat of loop 2. */
export type Loop2Exit = "next-round" | "next-set" | "landing" | "complete";

/**
 * The one decision in the ratio cycle with no side effects, so it is worth
 * stating in one place: rounds cycle until the set is done, a finished set
 * hands over to the next one (a longer phrase or a faster tempo, see
 * ratioPlan.ts), timed sessions then cycle forever because the countdown owns
 * the ending, the final round hands the phrase a landing beat when one is
 * armed, and otherwise the drill stops.
 */
export function loop2Exit(opts: {
	timed: boolean;
	round: number;
	rounds: number;
	landingBeat: boolean;
	hasNextSet?: boolean;
}): Loop2Exit {
	if (opts.round < opts.rounds) return "next-round";
	if (opts.hasNextSet) return "next-set";
	if (opts.timed) return "next-round";
	return opts.landingBeat ? "landing" : "complete";
}

export function getDefaultSettings(): AppSettings {
	return {
		mode: "ratios-training",
		limitMode: "rounds",
		timeSignature: { preset: "4/4", beatsPerBar: 4, beatUnit: 4 },
		sound: {
			soundId: "super-click",
			volumeAccent: 80,
			volumeNormal: 50,
			volumeSubdivision: 25,
			subdivisionClicksOn: true,
		},
		timer: { durationSec: 120 },
		dualLoop: {
			bpm: 120,
			loop1: { subdivision: "eighth-triplet", beats: 4 },
			loop2: { subdivision: "sextuplet", beats: 2 },
			rounds: 5,
			restBeats: 1,
			initialCountIn: 2,
			repeatCountIn: 1,
			landingBeat: true,
			linkLoops: true,
			progressiveEnabled: false,
			progressiveStep: 2,
			progressiveEndBpm: 140,
			buildUp: false,
		},
		progressive: {
			startBpm: 80,
			endBpm: 120,
			stepSize: 5,
			barsPerStep: 4,
			curve: "linear",
			subdivision: "sixteenth",
		},
		metronomeBpm: 120,
		metronomeSubdivision: "sixteenth",
	};
}
