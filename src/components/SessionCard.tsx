import { TimerPills } from "./TimerPills";

interface SessionCardProps {
	isPlaying: boolean;
	onToggle: () => void;
	timerSec: number;
	remainingSec: number | null;
	roundText: string;
	estText: string;
	onTimerChange: (v: number) => void;
}

export function SessionCard({
	isPlaying, onToggle, timerSec, remainingSec, roundText, estText, onTimerChange,
}: SessionCardProps) {
	const fmt = (sec: number | null) => {
		if (sec === null) return "--:--";
		const m = Math.floor(sec / 60), r = Math.floor(sec % 60);
		return String(m).padStart(2, "0") + ":" + String(r).padStart(2, "0");
	};
	const showRemaining = isPlaying && timerSec > 0 && remainingSec !== null;
	const displayTime = showRemaining ? remainingSec : (timerSec > 0 ? timerSec : null);

	return (
		<div className="card session-card">
			<div className="card-top-line" />
			<div className="session-header">
				<span className="section-label">Session</span>
				<div className="session-info">
					{roundText && <span className="session-round">{roundText}</span>}
					{estText && <span className="session-est">{estText}</span>}
				</div>
			</div>
			<div className="session-controls">
				<button
					className={`play-btn-main ${isPlaying ? "playing" : "stopped"}`}
					onClick={onToggle}
					aria-label={isPlaying ? "Stop" : "Play"}
				>
					<span style={{ fontSize: 15 }}>{isPlaying ? "■" : "▶"}</span>
					{isPlaying ? "Stop" : "Start"}
				</button>
				<div className="timer-display">
					<div className={`timer-value ${showRemaining ? "active" : "idle"}`}>{fmt(displayTime)}</div>
					<div className="timer-label">
						{timerSec > 0 ? (showRemaining ? "REMAINING" : "SESSION") : "NO LIMIT"}
					</div>
				</div>
			</div>
			<TimerPills value={timerSec} onChange={onTimerChange} />
		</div>
	);
}