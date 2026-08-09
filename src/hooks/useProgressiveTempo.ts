import { useRef, useState, useCallback } from "react";
import type { SoundEngine } from "../audio/SoundEngine";
import { MetronomeScheduler } from "../audio/scheduler";
import { SUBDIVISIONS } from "../config";
import type { AppSettings, CurveType } from "../types";

type ToastType = "accent" | "danger" | "success";

export function useProgressiveTempo(
	soundEngine: SoundEngine,
	onToast: (msg: string, type?: ToastType) => void,
) {
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentBeat, setCurrentBeat] = useState(0);
	const [currentBpm, setCurrentBpm] = useState(0);
	const schedulerRef = useRef<MetronomeScheduler | null>(null);
	const settingsRef = useRef<AppSettings | null>(null);
	const stateRef = useRef({ beatsInStep: 0, currentBpm: 0, totalBeats: 0 });

	const setSettings = useCallback((settings: AppSettings) => {
		settingsRef.current = settings;
	}, []);

	const generateCurve = useCallback(
		(type: CurveType, start: number, end: number, step: number): number[] => {
			const steps: number[] = [];
			if (type === "linear") {
				for (let b = start; b <= end; b += step) steps.push(b);
			} else if (type === "logarithmic") {
				const totalRange = end - start;
				const numSteps = Math.max(1, Math.ceil(totalRange / step));
				for (let i = 0; i <= numSteps; i++) {
					const t = i / numSteps;
					const b = Math.round(start + totalRange * (1 - (1 - t) ** 2));
					steps.push(Math.min(b, end));
				}
			} else if (type === "stepback") {
				let b = start;
				let pushBpm = start + step;
				while (b < end) {
					steps.push(b);
					steps.push(pushBpm);
					pushBpm = Math.min(pushBpm + step, end);
					b += step;
				}
				steps.push(end);
			} else if (type === "pyramid") {
				const up: number[] = [];
				for (let b = start; b <= end; b += step) up.push(b);
				const down = [...up].reverse();
				steps.push(...up, ...down.slice(1));
			}
			return [...new Set(steps)]; // dedupe
		},
		[],
	);

	const stopInternal = useCallback(() => {
		schedulerRef.current?.stop();
		schedulerRef.current = null;
		setIsPlaying(false);
		setCurrentBeat(0);
		setCurrentBpm(0);
	}, []);

	const start = useCallback(async () => {
		try {
			await soundEngine.resume();
		} catch (err) {
			console.error("AudioContext init failed:", err);
			onToast("Audio initialization failed", "danger");
			return;
		}
		const s = settingsRef.current!;
		const audioCtx = soundEngine.context!;
		const startBpm = s.progressive.startBpm;
		stateRef.current = { beatsInStep: 0, currentBpm: startBpm, totalBeats: 0 };
		setCurrentBpm(startBpm);

		const curveSteps = generateCurve(
			s.progressive.curve,
			s.progressive.startBpm,
			s.progressive.endBpm,
			s.progressive.stepSize,
		);
		const curveRef = { steps: curveSteps, index: 0 };

		const callbacks = {
			onScheduleBeat: (beatIndex: number, time: number) => {
				const s = settingsRef.current!;
				const isAccent = beatIndex % s.timeSignature.beatsPerBar === 0;
				soundEngine.playClick(
					time,
					isAccent ? "accent" : "normal",
					s.sound.soundId,
				);
				const st = stateRef.current;
				st.beatsInStep++;
				st.totalBeats++;
				const beatsPerStep =
					s.progressive.barsPerStep * s.timeSignature.beatsPerBar;
				if (st.beatsInStep >= beatsPerStep) {
					st.beatsInStep = 0;
					curveRef.index++;
					if (curveRef.index < curveRef.steps.length) {
						st.currentBpm = curveRef.steps[curveRef.index];
						setCurrentBpm(st.currentBpm);
						onToast(`Tempo → ${st.currentBpm} BPM`);
					} else {
						// Fix 16/R2.7: Stop immediately, call onToast directly
						schedulerRef.current?.stop();
						schedulerRef.current = null;
						queueMicrotask(() => {
							setIsPlaying(false);
							onToast("Practice complete", "success");
						});
					}
				}
			},
			onScheduleSubdivision: (_subIndex: number, time: number) => {
				const s = settingsRef.current!;
				if (!s.sound.subdivisionClicksOn) return;
				soundEngine.playClick(time, "subdivision", s.sound.soundId);
			},
			onVisualBeat: (beatIndex: number) => {
				const s = settingsRef.current!;
				setCurrentBeat(beatIndex % s.timeSignature.beatsPerBar);
			},
			getBpm: () => stateRef.current.currentBpm,
			getNotesPerBeat: () => {
				const s = settingsRef.current!;
				const found = SUBDIVISIONS.find(
					(x) => x.id === s.progressive.subdivision,
				);
				return found ? found.notesPerBeat : 1;
			},
		};

		schedulerRef.current = new MetronomeScheduler(audioCtx, callbacks);
		schedulerRef.current.start();
		setIsPlaying(true);
	}, [soundEngine, onToast, generateCurve]);

	const stop = stopInternal;
	const toggle = useCallback(() => {
		if (isPlaying) stop();
		else start();
	}, [isPlaying, start, stop]);

	const tapTimesRef = useRef<number[]>([]);

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
			const detected = Math.round(60000 / avgMs);
			// Clamp to current startBpm range
			return Math.max(20, Math.min(320, detected));
		}
		return null;
	}, []);

	return {
		isPlaying,
		currentBeat,
		currentBpm,
		setSettings,
		start,
		stop,
		toggle,
		generateCurve,
		tapTempo,
	};
}
