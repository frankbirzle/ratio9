import { TimerPills } from "./TimerPills";
import type { LimitMode, Mode } from "../types";

interface SessionCardProps {
	mode: Mode;
	limitMode: LimitMode;
	onLimitModeChange: (m: LimitMode) => void;
	rounds: number;
	onRoundsChange: (v: number) => void;
	timerSec: number;
	estText: string;
	roundsCaption: string;
	onTimerChange: (v: number) => void;
}

/**
 * One authority for when a session ends. The left segment is whatever the
 * current mode's natural end is (rounds / full ramp / open), the right is a
 * fixed duration. Picking one hides the other's editor, so the two can never
 * both be armed.
 */
export function SessionCard({
	mode,
	limitMode,
	onLimitModeChange,
	rounds,
	onRoundsChange,
	timerSec,
	estText,
	roundsCaption,
	onTimerChange,
}: SessionCardProps) {
	const timed = limitMode === "time";
	const isRatios = mode === "ratios-training";
	const limitALabel = isRatios
		? "Rounds"
		: mode === "speed-training"
			? "Full ramp"
			: "Open";

	return (
		<div className="card session-card">
			<div className="card-top-line" />
			<div className="session-length-header">
				<span className="section-label">Session ends</span>
				{estText && <span className="session-est">{estText}</span>}
			</div>

			<div className="limit-switcher">
				<button
					className={`limit-btn${timed ? "" : " active"}`}
					onClick={() => onLimitModeChange("rounds")}
					aria-pressed={!timed}
				>
					{limitALabel}
				</button>
				<button
					className={`limit-btn${timed ? " active" : ""}`}
					onClick={() => onLimitModeChange("time")}
					aria-pressed={timed}
				>
					Time
				</button>
			</div>

			{!timed && isRatios && (
				<div className="limit-row">
					<div className="limit-row-text">
						<span className="limit-row-label">Rounds</span>
						<span className="limit-row-hint">Loop 1 → loop 2 cycles</span>
					</div>
					<div className="limit-stepper">
						<button
							className="limit-step-btn"
							onClick={() => onRoundsChange(Math.max(1, rounds - 1))}
							aria-label="Fewer rounds"
						>
							−
						</button>
						<span className="limit-step-value">{rounds}</span>
						<button
							className="limit-step-btn"
							onClick={() => onRoundsChange(Math.min(20, rounds + 1))}
							aria-label="More rounds"
						>
							+
						</button>
					</div>
				</div>
			)}

			{!timed && !isRatios && (
				<div className="limit-caption">
					<span className="limit-row-label">{limitALabel}</span>
					<span className="limit-caption-text">{roundsCaption}</span>
				</div>
			)}

			{timed && <TimerPills value={timerSec} onChange={onTimerChange} />}
		</div>
	);
}
