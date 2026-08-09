import {
	SUBDIVISIONS,
	getSubdivisionsForMeter,
	BPM_MIN,
	BPM_MAX,
} from "../config";
import type { AppSettings, Subdivision } from "../types";
import { RampChart } from "./RampChart";
import { TickGrid } from "./TickGrid";

interface SpeedTrainingPanelProps {
	settings: AppSettings;
	updateSettings: (patch: Partial<AppSettings>) => void;
	isPlaying: boolean;
	currentBeat: number;
	currentBpm: number;
}

export function SpeedTrainingPanel({
	settings,
	updateSettings,
	isPlaying,
	currentBeat,
	currentBpm,
}: SpeedTrainingPanelProps) {
	const p = settings.progressive;
	const subs = getSubdivisionsForMeter(settings.timeSignature.beatUnit);
	const activeSub = SUBDIVISIONS.find((s) => s.id === p.subdivision);
	const displayBpm = isPlaying ? currentBpm : p.startBpm;
	const rampPct =
		p.endBpm > p.startBpm
			? Math.round(
					100 *
						Math.max(
							0,
							Math.min(1, (displayBpm - p.startBpm) / (p.endBpm - p.startBpm)),
						),
				)
			: 0;

	// Ramp chart bars
	const steps = Math.max(
		1,
		Math.ceil((p.endBpm - p.startBpm) / p.stepSize) + 1,
	);
	const rampBars = Array.from({ length: Math.min(steps, 14) }, (_, i) => {
		const v = Math.min(p.endBpm, p.startBpm + i * p.stepSize);
		return {
			heightPct:
				22 +
				(p.endBpm > p.startBpm
					? ((v - p.startBpm) / (p.endBpm - p.startBpm)) * 78
					: 0),
			done: isPlaying && v <= currentBpm,
		};
	});

	// Tick grid
	const npb = activeSub ? activeSub.notesPerBeat : 1;
	const beats = settings.timeSignature.beatsPerBar;
	const ticks = Array.from({ length: beats * npb }, (_, i) => ({
		height:
			isPlaying && i === currentBeat * npb + 0 ? 34 : i % npb === 0 ? 22 : 13,
		phase: "bar",
		active: isPlaying && Math.floor(i / npb) === currentBeat && i % npb === 0,
		marginLeft: i % npb === 0 && i > 0 ? 9 : 0,
	}));

	return (
		<div className="card">
			<div className="card-top-line" />
			<div
				style={{
					display: "flex",
					alignItems: "flex-start",
					justifyContent: "space-between",
					gap: 16,
					marginBottom: 18,
				}}
			>
				<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
					<span className="section-label">Tempo ramp</span>
					<span
						style={{
							font: "400 10px/1 var(--font-mono)",
							color: "var(--text-dim)",
						}}
					>
						{steps} steps · +{p.stepSize} every {p.barsPerStep} bars
					</span>
				</div>
				<div
					style={{
						font: "300 30px/1 var(--font-mono)",
						color: "#F2F4F6",
						fontVariantNumeric: "tabular-nums",
					}}
				>
					{rampPct}
					<span style={{ fontSize: 15, color: "var(--text-muted)" }}>%</span>
				</div>
			</div>
			<RampChart bars={rampBars} />
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "1fr 1fr",
					gap: 10,
					marginBottom: 10,
				}}
			>
				<div className="speed-bpm-box">
					<div className="section-label" style={{ marginBottom: 9 }}>
						Start
					</div>
					<div className="speed-bpm-row">
						<button
							className="speed-bpm-btn"
							onClick={() =>
								updateSettings({
									progressive: {
										...p,
										startBpm: Math.max(BPM_MIN, p.startBpm - 5),
									},
								})
							}
						>
							−
						</button>
						<span className="speed-bpm-val">{p.startBpm}</span>
						<button
							className="speed-bpm-btn"
							onClick={() =>
								updateSettings({
									progressive: {
										...p,
										startBpm: Math.min(p.endBpm, p.startBpm + 5),
									},
								})
							}
						>
							+
						</button>
					</div>
				</div>
				<div className="speed-bpm-box">
					<div className="section-label" style={{ marginBottom: 9 }}>
						Target
					</div>
					<div className="speed-bpm-row">
						<button
							className="speed-bpm-btn"
							onClick={() =>
								updateSettings({
									progressive: {
										...p,
										endBpm: Math.max(p.startBpm, p.endBpm - 5),
									},
								})
							}
						>
							−
						</button>
						<span className="speed-bpm-val target">{p.endBpm}</span>
						<button
							className="speed-bpm-btn"
							onClick={() =>
								updateSettings({
									progressive: {
										...p,
										endBpm: Math.min(BPM_MAX, p.endBpm + 5),
									},
								})
							}
						>
							+
						</button>
					</div>
				</div>
			</div>
			<div className="custom-select-wrap">
				<select
					className="custom-select"
					value={p.subdivision}
					onChange={(e) =>
						updateSettings({
							progressive: { ...p, subdivision: e.target.value as Subdivision },
						})
					}
					aria-label="Subdivision"
				>
					{subs.map((s) => (
						<option key={s.id} value={s.id}>
							{s.label}
						</option>
					))}
				</select>
				<div className="custom-select-arrow">▼</div>
			</div>
			<div style={{ marginTop: 14 }}>
				<TickGrid ticks={ticks} maxHeight={44} />
			</div>
		</div>
	);
}
