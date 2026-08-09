import { useState, useRef, useCallback } from "react";

export function useCountdownTimer(onExpire: () => void) {
	const [remainingSec, setRemainingSec] = useState<number | null>(null);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const onExpireRef = useRef(onExpire);
	onExpireRef.current = onExpire;

	const start = useCallback((durationSec: number) => {
		setRemainingSec(durationSec);
		if (intervalRef.current) clearInterval(intervalRef.current);
		const startTime = Date.now();
		intervalRef.current = setInterval(() => {
			const elapsed = (Date.now() - startTime) / 1000;
			const remaining = durationSec - elapsed;
			if (remaining <= 0) {
				setRemainingSec(0);
				if (intervalRef.current) clearInterval(intervalRef.current);
				intervalRef.current = null;
				onExpireRef.current();
			} else {
				setRemainingSec(remaining);
			}
		}, 100);
	}, []);

	const stop = useCallback(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
		setRemainingSec(null);
	}, []);

	const formatTime = useCallback((sec: number | null): string => {
		if (sec === null) return "";
		const mins = Math.floor(sec / 60);
		const secs = Math.floor(sec % 60);
		return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
	}, []);

	return { remainingSec, start, stop, formatTime };
}
