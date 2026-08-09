import { useRef, useCallback } from "react";
import { BPM_MIN, BPM_MAX } from "../config";

interface BpmKnobProps {
	value: number;
	onChange: (v: number) => void;
	min?: number;
	max?: number;
	timerPct?: number | null; // 0–100 of timer remaining, null = no timer
}

export function BpmKnob({ value, onChange, min = BPM_MIN, max = BPM_MAX, timerPct = null }: BpmKnobProps) {
	const knobRef = useRef<HTMLDivElement>(null);
	const clamp = (v: number) => Math.max(min, Math.min(max, v));
	const pct = Math.max(0, Math.min(1, (value - BPM_MIN) / (BPM_MAX - BPM_MIN)));
	const arcDash = (75 * pct).toFixed(2);
	const knobRot = (-140 + 280 * pct).toFixed(1);

	const handlePointerDown = useCallback((e: React.PointerEvent) => {
		e.preventDefault();
		const startY = e.clientY;
		const startX = e.clientX;
		const base = value;
		const move = (ev: PointerEvent) => {
			const delta = Math.round(((startY - ev.clientY) + (ev.clientX - startX)) * 0.4);
			onChange(clamp(base + delta));
		};
		const up = () => {
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", up);
		};
		window.addEventListener("pointermove", move);
		window.addEventListener("pointerup", up);
	}, [value, onChange]); // eslint-disable-line react-hooks/exhaustive-deps

	const handleWheel = useCallback((e: React.WheelEvent) => {
		onChange(clamp(value + (e.deltaY < 0 ? 1 : -1)));
	}, [value, onChange]); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<div className="knob-wrap" onPointerDown={handlePointerDown} onWheel={handleWheel}>
			<div className="knob-tick-marks" />
			<svg className="knob-arc-svg" viewBox="0 0 300 300" style={{ transform: "rotate(135deg)" }}>
				<circle className="knob-arc-track" cx="150" cy="150" r="141" pathLength={100} strokeDasharray="75 100" />
				<circle className="knob-arc-fill" cx="150" cy="150" r="141" pathLength={100} strokeDasharray={`${arcDash} 100`} />
			</svg>
			{timerPct !== null && (
				<svg className="knob-arc-svg" viewBox="0 0 300 300" style={{ transform: "rotate(-90deg)" }}>
					<circle className="knob-timer-ring" cx="150" cy="150" r="127" pathLength={100} strokeDasharray={`${timerPct.toFixed(2)} 100`} />
				</svg>
			)}
			<div className="knob-body" ref={knobRef}>
				<div className="knob-inner-ring" />
				<div className="knob-indicator" style={{ transform: `rotate(${knobRot}deg)` }}>
					<div className="knob-indicator-line" />
				</div>
				<div className="knob-display">
					<div className="knob-bpm">{value}</div>
					<div className="knob-bpm-label">BPM</div>
				</div>
			</div>
		</div>
	);
}