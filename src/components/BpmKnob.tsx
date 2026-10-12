import { useRef, useCallback } from "react";
import { BPM_MIN, BPM_MAX } from "../config";
import { KNOB_BPM_PER_PX, snapBpm } from "../knobMath";

interface BpmKnobProps {
	value: number;
	onChange: (v: number) => void;
	min?: number;
	max?: number;
	timerPct?: number | null; // 0–100 of timer remaining, null = no timer
	isPlaying?: boolean;
	onToggle?: () => void;
}

// Per the design: movement under 5px total does not start a drag, and a
// release within 600ms of a non-drag counts as a tap.
const DRAG_SLOP_PX = 5;
const TAP_MAX_MS = 600;

export function BpmKnob({
	value,
	onChange,
	min = BPM_MIN,
	max = BPM_MAX,
	timerPct = null,
	isPlaying = false,
	onToggle,
}: BpmKnobProps) {
	const knobRef = useRef<HTMLDivElement>(null);
	const clamp = (v: number) => Math.max(min, Math.min(max, v));
	const pct = Math.max(0, Math.min(1, (value - BPM_MIN) / (BPM_MAX - BPM_MIN)));
	const arcDash = (75 * pct).toFixed(2);
	const knobRot = (-140 + 280 * pct).toFixed(1);

	const handlePointerDown = useCallback(
		(e: React.PointerEvent) => {
			e.preventDefault();
			const startY = e.clientY;
			const startX = e.clientX;
			const startedAt = performance.now();
			const base = value;
			let dragged = false;

			const move = (ev: PointerEvent) => {
				const dy = startY - ev.clientY;
				const dx = ev.clientX - startX;
				if (!dragged && Math.abs(dy) + Math.abs(dx) < DRAG_SLOP_PX) return;
				dragged = true;
				onChange(clamp(snapBpm(base + (dy + dx) * KNOB_BPM_PER_PX)));
			};

			const up = () => {
				window.removeEventListener("pointermove", move);
				window.removeEventListener("pointerup", up);
				const quick = performance.now() - startedAt < TAP_MAX_MS;
				if (!dragged && quick) onToggle?.();
			};

			window.addEventListener("pointermove", move);
			window.addEventListener("pointerup", up);
		},
		[value, onChange, onToggle], // eslint-disable-line react-hooks/exhaustive-deps
	);

	const handleWheel = useCallback(
		(e: React.WheelEvent) => {
			onChange(clamp(value + (e.deltaY < 0 ? 1 : -1)));
		},
		[value, onChange], // eslint-disable-line react-hooks/exhaustive-deps
	);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			onToggle?.();
		} else if (e.key === "ArrowUp" || e.key === "ArrowRight") {
			e.preventDefault();
			onChange(clamp(value + (e.shiftKey ? 5 : 1)));
		} else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
			e.preventDefault();
			onChange(clamp(value - (e.shiftKey ? 5 : 1)));
		}
	};

	return (
		<div
			className="knob-wrap"
			onPointerDown={handlePointerDown}
			onWheel={handleWheel}
		>
			<div className="knob-tick-marks" />
			<svg
				className="knob-arc-svg"
				viewBox="0 0 300 300"
				style={{ transform: "rotate(135deg)" }}
			>
				<circle
					className="knob-arc-track"
					cx="150"
					cy="150"
					r="141"
					pathLength={100}
					strokeDasharray="75 100"
				/>
				<circle
					className="knob-arc-fill"
					cx="150"
					cy="150"
					r="141"
					pathLength={100}
					strokeDasharray={`${arcDash} 100`}
				/>
			</svg>
			{timerPct !== null && (
				<svg
					className="knob-arc-svg"
					viewBox="0 0 300 300"
					style={{ transform: "rotate(-90deg)" }}
				>
					<circle
						className="knob-timer-ring"
						cx="150"
						cy="150"
						r="127"
						pathLength={100}
						strokeDasharray={`${timerPct.toFixed(2)} 100`}
					/>
				</svg>
			)}
			<div
				className="knob-body"
				ref={knobRef}
				role={onToggle ? "button" : undefined}
				tabIndex={onToggle ? 0 : undefined}
				aria-pressed={onToggle ? isPlaying : undefined}
				aria-label={
					onToggle ? "Drag to set tempo, tap to start or stop" : undefined
				}
				onKeyDown={onToggle ? handleKeyDown : undefined}
			>
				<div className="knob-inner-ring" />
				<div
					className="knob-indicator"
					style={{ transform: `rotate(${knobRot}deg)` }}
				>
					<div className="knob-indicator-line" />
				</div>
				<div className="knob-display">
					<div className="knob-bpm">{value}</div>
					<div className="knob-bpm-label">BPM</div>
					{onToggle && (
						<div className={`knob-hint${isPlaying ? " playing" : ""}`}>
							<span className="knob-hint-icon">{isPlaying ? "■" : "▶"}</span>
							<span className="knob-hint-label">
								{isPlaying ? "Stop" : "Tap to start"}
							</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
