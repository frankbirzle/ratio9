import { SUBDIVISIONS, getSubdivisionsForMeter, notesPerSecond } from "../config";
import type { AppSettings, Subdivision } from "../types";
import { TickGrid } from "./TickGrid";

interface MetronomePanelProps {
	settings: AppSettings;
	updateSettings: (patch: Partial<AppSettings>) => void;
	isPlaying: boolean;
	currentBeat: number; // -1 = not active
}

export function MetronomePanel({
	settings, updateSettings, isPlaying, currentBeat,
}: MetronomePanelProps) {
	const subs = getSubdivisionsForMeter(settings.timeSignature.beatUnit);
	const activeSub = SUBDIVISIONS.find((s) => s.id === settings.metronomeSubdivision);
	const nps = activeSub ? notesPerSecond(settings.metronomeBpm, activeSub.notesPerBeat) : 0;
	const beats = settings.timeSignature.beatsPerBar;
	const npb = activeSub ? activeSub.notesPerBeat : 1;

	// Tick grid: one tick per subdivision per beat; active tick derived from currentBeat
	const activeBeatIdx = isPlaying ? currentBeat : -1;
	const ticks = Array.from({ length: beats * npb }, (_, i) => ({
		height: isPlaying && Math.floor(i / npb) === activeBeatIdx ? 34 : (i % npb === 0 ? 22 : 13),
		phase: "bar",
		active: isPlaying && Math.floor(i / npb) === activeBeatIdx && i % npb === 0,
		marginLeft: i % npb === 0 && i > 0 ? 9 : 0,
	}));

	return (
		<div className="card">
			<div className="card-top-line" />
			<div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 18 }}>
				<span className="section-label">Pulse</span>
				<span style={{ font: "400 10px/1 var(--font-mono)", color: "var(--text-muted)" }}>
					{nps.toFixed(1)} notes/sec
				</span>
			</div>
			<div className="custom-select-wrap" style={{ marginBottom: 18 }}>
				<select
					className="custom-select"
					value={settings.metronomeSubdivision}
					onChange={(e) => updateSettings({ metronomeSubdivision: e.target.value as Subdivision })}
					aria-label="Subdivision"
				>
					{subs.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
				</select>
				<div className="custom-select-arrow">▼</div>
			</div>
			<TickGrid ticks={ticks} maxHeight={44} />
		</div>
	);
}