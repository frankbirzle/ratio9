import { useRef, useState, useCallback } from "react";
import type { SoundEngine } from "../audio/SoundEngine";
import { MetronomeScheduler } from "../audio/scheduler";
import {
	SUBDIVISIONS,
	BPM_MIN,
	BPM_MAX,
	isPhaseAccent,
	loop2Exit,
} from "../config";
import type { AppSettings } from "../types";
import { ratioSets, nextSet, type RatioSet } from "../ratioPlan";

type Phase =
	| "idle"
	| "count-in"
	| "loop1"
	| "loop2"
	| "rest"
	| "landing"
	| "complete";

export function useDualLoop(
	soundEngine: SoundEngine,
	onToast?: (msg: string, type?: "accent" | "danger" | "success") => void,
) {
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentBeat, setCurrentBeat] = useState(0);
	const [activeLoop, setActiveLoop] = useState<1 | 2 | null>(null);
	const [currentRound, setCurrentRound] = useState(0);
	const [phase, setPhase] = useState<Phase>("idle");
	const [activeDotIndex, setActiveDotIndex] = useState(-1);
	const [visualRound, setVisualRound] = useState(0);
	// The set being played: tempo and phrase length can differ from the knob
	// and the steppers once the ramp or the build-up is on.
	const [liveSet, setLiveSet] = useState<RatioSet | null>(null);
	const [liveSetIndex, setLiveSetIndex] = useState(0);
	const schedulerRef = useRef<MetronomeScheduler | null>(null);
	const settingsRef = useRef<AppSettings | null>(null);
	const visualMapRef = useRef<Map<number, { absBeat: number; round: number }>>(
		new Map(),
	);
	const tapTimesRef = useRef<number[]>([]);
	const resyncNotifiedRef = useRef(false);
	const stateRef = useRef({
		beatInPhase: 0,
		absBeat: 0,
		phase: "idle" as Phase,
		round: 0,
		activeSub:
			"eighth-triplet" as AppSettings["dualLoop"]["loop1"]["subdivision"],
		sets: [] as RatioSet[],
		setIndex: 0,
	});

	const setSettings = useCallback((settings: AppSettings) => {
		settingsRef.current = settings;
	}, []);

	const stopInternal = useCallback(() => {
		schedulerRef.current?.stop();
		schedulerRef.current = null;
		setIsPlaying(false);
		setCurrentBeat(0);
		setActiveLoop(null);
		setCurrentRound(0);
		setPhase("idle");
		setActiveDotIndex(-1);
		setVisualRound(0);
		setLiveSet(null);
		setLiveSetIndex(0);
		visualMapRef.current.clear();
	}, []);

	const start = useCallback(async () => {
		try {
			await soundEngine.resume();
		} catch (err) {
			console.error("AudioContext init failed:", err);
			onToast?.("Audio initialization failed", "danger");
			return;
		}
		const s = settingsRef.current!;
		const audioCtx = soundEngine.context!;
		visualMapRef.current.clear();
		resyncNotifiedRef.current = false;

		// The session plan is fixed at start; the knob and steppers are read
		// through it from here on, so a mid-session settings change waits for the
		// next start.
		const sets = ratioSets(s.dualLoop);
		// Fix 5: Initialize round to 1 when initialCountIn === 0
		stateRef.current = {
			beatInPhase: 0,
			absBeat: 0,
			phase: s.dualLoop.initialCountIn > 0 ? "count-in" : "loop1",
			round: s.dualLoop.initialCountIn > 0 ? 0 : 1,
			activeSub: s.dualLoop.loop1.subdivision,
			sets,
			setIndex: 0,
		};
		setLiveSet(sets[0]);
		setLiveSetIndex(0);
		setPhase(stateRef.current.phase);
		setActiveLoop(stateRef.current.phase === "loop1" ? 1 : null);
		setCurrentRound(s.dualLoop.initialCountIn > 0 ? 0 : 1);
		setActiveDotIndex(0);
		setVisualRound(s.dualLoop.initialCountIn > 0 ? 0 : 1);

		/**
		 * Ends the session. Called either straight off the last loop-2 beat or, when
		 * the landing beat is armed, one beat later. Stopping the scheduler here is
		 * safe: the beat that triggered this is already scheduled in the audio graph.
		 */
		const finish = () => {
			stateRef.current.phase = "complete";
			schedulerRef.current?.stop();
			schedulerRef.current = null;
			queueMicrotask(() => {
				setPhase("complete");
				setActiveLoop(null);
				setIsPlaying(false);
				setActiveDotIndex(-1);
				onToast?.("Practice complete", "success");
			});
		};

		const callbacks = {
			onScheduleBeat: (beatIndex: number, time: number) => {
				const st = stateRef.current;
				const s = settingsRef.current!;
				// Keyed off beatInPhase, not the scheduler's absolute beat index: that
				// index never resets, so any phase length that isn't a multiple of
				// beatsPerBar (loop1 = 3, rest = 1, ...) drifts the accent into the
				// middle of the phrase and loses the "where do I start, where do I land"
				// cue the drill runs on.
				const isAccent = isPhaseAccent(
					st.beatInPhase,
					s.timeSignature.beatsPerBar,
				);
				soundEngine.playClick(
					time,
					isAccent ? "accent" : "normal",
					s.sound.soundId,
				);
				st.beatInPhase++;
				st.absBeat++;
				// Capture visual state at schedule time (before any phase transition)
				visualMapRef.current.set(beatIndex, {
					absBeat: st.absBeat - 1,
					round: st.round,
				});

				if (st.phase === "count-in") {
					const countInBeats =
						st.round === 0
							? s.dualLoop.initialCountIn
							: s.dualLoop.repeatCountIn;
					if (st.beatInPhase >= countInBeats) {
						st.beatInPhase = 0;
						st.phase = "loop1";
						st.activeSub = s.dualLoop.loop1.subdivision;
						if (st.round === 0) st.round = 1; // Only set to 1 on initial count-in; preserve incremented round for repeat count-ins
						const newRound = st.round;
						queueMicrotask(() => {
							setPhase("loop1");
							setActiveLoop(1);
							setCurrentRound(newRound);
						});
					}
				} else if (st.phase === "loop1") {
					if (st.beatInPhase >= st.sets[st.setIndex].loop1Beats) {
						st.beatInPhase = 0;
						if (s.dualLoop.restBeats > 0) {
							st.phase = "rest";
							queueMicrotask(() => {
								setPhase("rest");
								setActiveLoop(null);
							});
						} else {
							st.phase = "loop2";
							st.activeSub = s.dualLoop.loop2.subdivision;
							queueMicrotask(() => {
								setPhase("loop2");
								setActiveLoop(2);
							});
						}
					}
				} else if (st.phase === "rest") {
					if (st.beatInPhase >= s.dualLoop.restBeats) {
						st.beatInPhase = 0;
						st.phase = "loop2";
						st.activeSub = s.dualLoop.loop2.subdivision;
						queueMicrotask(() => {
							setPhase("loop2");
							setActiveLoop(2);
						});
					}
				} else if (st.phase === "loop2") {
					if (st.beatInPhase >= st.sets[st.setIndex].loop2Beats) {
						st.beatInPhase = 0;
						const following = nextSet(st.sets, st.setIndex);
						const exit = loop2Exit({
							timed: s.limitMode === "time",
							round: st.round,
							rounds: s.dualLoop.rounds,
							landingBeat: s.dualLoop.landingBeat,
							hasNextSet: following !== null,
						});
						if (exit === "landing") {
							// One more beat, then done. Every earlier round already hands the
							// phrase a downbeat to resolve onto (the first rest beat, or loop
							// 1's first beat when there is no rest); this is the one the end of
							// the session was swallowing.
							st.phase = "landing";
							queueMicrotask(() => {
								setPhase("landing");
								setActiveLoop(null);
							});
						} else if (exit === "complete") {
							// Fix 16: Stop immediately instead of setTimeout(100)
							finish();
						} else {
							if (exit === "next-set" && following) {
								// A finished set hands over to the next: longer phrase first,
								// faster tempo once every phrase length has been played.
								st.setIndex++;
								st.round = 0;
								const idx = st.setIndex;
								queueMicrotask(() => {
									setLiveSet(following);
									setLiveSetIndex(idx);
								});
							}
							st.round++;
							st.absBeat = 0; // Reset absolute beat for new round
							if (s.dualLoop.repeatCountIn > 0) {
								st.phase = "count-in";
								queueMicrotask(() => {
									setPhase("count-in");
									setActiveLoop(null);
									setCurrentRound(st.round);
								});
							} else {
								st.phase = "loop1";
								st.activeSub = s.dualLoop.loop1.subdivision;
								queueMicrotask(() => {
									setPhase("loop1");
									setActiveLoop(1);
									setCurrentRound(st.round);
								});
							}
						}
					}
				} else if (st.phase === "landing") {
					// The landing beat is exactly one click. It has already been scheduled
					// above, so the session can end right here.
					finish();
				}
			},
			onScheduleSubdivision: (_subIndex: number, time: number) => {
				const st = stateRef.current;
				const s = settingsRef.current!;
				if (!s.sound.subdivisionClicksOn) return;
				// The landing beat is a bare click, not another six notes: the phrase
				// resolves onto it, nothing is played through it.
				if (
					st.phase === "rest" ||
					st.phase === "count-in" ||
					st.phase === "landing"
				)
					return;
				soundEngine.playClick(time, "subdivision", s.sound.soundId);
			},
			onVisualBeat: (beatIndex: number) => {
				const s = settingsRef.current!;
				setCurrentBeat(beatIndex % s.timeSignature.beatsPerBar);
				// Set audio-synced dot position from the visual map
				const info = visualMapRef.current.get(beatIndex);
				if (info) {
					setActiveDotIndex(info.absBeat);
					setVisualRound(info.round);
					visualMapRef.current.delete(beatIndex);
				}
			},
			onResync: () => {
				if (resyncNotifiedRef.current) return;
				resyncNotifiedRef.current = true;
				onToast?.("Timing resynced, some beats were dropped", "danger");
			},
			getBpm: () => {
				const st = stateRef.current;
				return st.sets[st.setIndex]?.bpm ?? settingsRef.current?.dualLoop.bpm ?? 120;
			},
			getNotesPerBeat: () => {
				const st = stateRef.current;
				const found = SUBDIVISIONS.find((x) => x.id === st.activeSub);
				return found ? found.notesPerBeat : 1;
			},
		};

		schedulerRef.current = new MetronomeScheduler(audioCtx, callbacks);
		schedulerRef.current.start();
		setIsPlaying(true);
	}, [soundEngine, onToast]);

	const stop = stopInternal;

	const toggle = useCallback(() => {
		if (isPlaying) stop();
		else start();
	}, [isPlaying, start, stop]);

	const tapTempo = useCallback(() => {
		const now = Date.now();
		const tapTimes = tapTimesRef.current;
		if (tapTimes.length > 0 && now - tapTimes[tapTimes.length - 1] > 2500) {
			tapTimesRef.current = [];
		}
		tapTimesRef.current.push(now);
		if (tapTimesRef.current.length > 8) tapTimesRef.current.shift();
		if (tapTimesRef.current.length >= 2) {
			const times = tapTimesRef.current;
			let total = 0;
			for (let i = 1; i < times.length; i++) total += times[i] - times[i - 1];
			const avgMs = total / (times.length - 1);
			return Math.max(BPM_MIN, Math.min(BPM_MAX, Math.round(60000 / avgMs)));
		}
		return null;
	}, []);

	return {
		isPlaying,
		currentBeat,
		activeLoop,
		currentRound,
		phase,
		activeDotIndex,
		visualRound,
		liveSet,
		liveSetIndex,
		setSettings,
		start,
		stop,
		toggle,
		tapTempo,
	};
}
