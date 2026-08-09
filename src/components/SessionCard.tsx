import { TimerPills } from "./TimerPills";

interface SessionCardProps {
	timerSec: number;
	estText: string;
	onTimerChange: (v: number) => void;
}

/**
 * Session length only. The transport moved onto the knob and the round/timer
 * readout moved into the tempo card, per the design.
 */
export function SessionCard({
	timerSec,
	estText,
	onTimerChange,
}: SessionCardProps) {
	return (
		<div className="card session-card">
			<div className="card-top-line" />
			<div className="session-length-header">
				<span className="section-label">Session length</span>
				{estText && <span className="session-est">{estText}</span>}
			</div>
			<TimerPills value={timerSec} onChange={onTimerChange} />
		</div>
	);
}
