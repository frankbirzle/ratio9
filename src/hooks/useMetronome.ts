import { useRef, useState, useCallback } from "react";
import type { SoundEngine } from "../audio/SoundEngine";
import { MetronomeScheduler } from "../audio/scheduler";
import { BPM_MIN, BPM_MAX, SUBDIVISIONS } from "../config";
import type { Subdivision, AppSettings } from "../types";

export function useMetronome(
	soundEngine: SoundEngine,
	onToast?: (msg: string, type?: "accent" | "danger" | "success") => void,
) {
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentBeat, setCurrentBeat] = useState(0);
	const schedulerRef = useRef<MetronomeScheduler | null>(null);
	const settingsRef = useRef<AppSettings | null>(null);
	const tapTimesRef = useRef<number[]>([]);

	const setSettings = useCallback((settings: AppSettings) => {
		settingsRef.current = settings;
	}, []);

	const start = useCallback(async () => {
		try {
			await soundEngine.resume();
		} catch (err) {
			console.error("AudioContext init failed:", err);
			onToast?.("Audio initialization failed", "danger");
			return;
		}
		const audioCtx = soundEngine.context!;
		const callbacks = {
			onScheduleBeat: (beatIndex: number, time: number) => {
				const s = settingsRef.current;
				if (!s) return;
				const isAccent = beatIndex % s.timeSignature.beatsPerBar === 0;
				soundEngine.playClick(
					time,
					isAccent ? "accent" : "normal",
					s.sound.soundId,
				);
			},
			onScheduleSubdivision: (_subIndex: number, time: number) => {
				const s = settingsRef.current;
				if (!s || !s.sound.subdivisionClicksOn) return;
				soundEngine.playClick(time, "subdivision", s.sound.soundId);
			},
			onVisualBeat: (beatIndex: number) => {
				const s = settingsRef.current;
				if (!s) return;
				setCurrentBeat(beatIndex % s.timeSignature.beatsPerBar);
			},
			getBpm: () => {
				const s = settingsRef.current;
				if (!s) return 120;
				return s.mode === "metronome" ? s.metronomeBpm : s.dualLoop.bpm;
			},
			getNotesPerBeat: () => {
				const s = settingsRef.current;
				if (!s) return 1;
				const sub =
					s.mode === "metronome"
						? s.metronomeSubdivision
						: getActiveSubdivision(s);
				const found = SUBDIVISIONS.find((x) => x.id === sub);
				return found ? found.notesPerBeat : 1;
			},
		};
		schedulerRef.current = new MetronomeScheduler(audioCtx, callbacks);
		schedulerRef.current.start();
		setIsPlaying(true);
	}, [soundEngine, onToast]);

	const stop = useCallback(() => {
		schedulerRef.current?.stop();
		schedulerRef.current = null;
		setIsPlaying(false);
		setCurrentBeat(0);
	}, []);

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

	return { isPlaying, currentBeat, setSettings, start, stop, toggle, tapTempo };
}

function getActiveSubdivision(s: AppSettings): Subdivision {
	if (s.mode === "ratios-training") return s.dualLoop.loop1.subdivision;
	if (s.mode === "speed-training") return s.progressive.subdivision;
	return s.metronomeSubdivision;
}
