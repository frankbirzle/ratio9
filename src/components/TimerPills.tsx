import { TIMER_PRESETS_SEC } from "../config";

interface TimerPillsProps {
	value: number; // 0 = free
	onChange: (v: number) => void;
}

export function TimerPills({ value, onChange }: TimerPillsProps) {
	return (
		<div className="timer-pills">
			{TIMER_PRESETS_SEC.map((t) => (
				<button
					key={t.value}
					className={`timer-pill ${value === t.value ? "active" : ""}`}
					onClick={() => onChange(t.value)}
				>
					{t.label}
				</button>
			))}
		</div>
	);
}