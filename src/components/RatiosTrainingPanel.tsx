import { SUBDIVISIONS, getSubdivisionsForMeter } from "../config";
import type { AppSettings, Subdivision, LoopConfig } from "../types";
import { TickGrid } from "./TickGrid";
import { applyLoopLink, loop1Step, LOOP_BEATS_MAX, type RatioSet } from "../ratioPlan";

interface RatiosTrainingPanelProps {
	settings: AppSettings;
	updateSettings: (patch: Partial<AppSettings>) => void;
	isPlaying: boolean;
	activeLoop: 1 | 2 | null;
	activeDotIndex: number;
	visualRound: number;
	liveSet: RatioSet | null;
	liveSetIndex: number;
}

export function RatiosTrainingPanel({
	settings,
	updateSettings,
	isPlaying,
	activeLoop,
	activeDotIndex,
	visualRound,
	liveSet,
	liveSetIndex,
}: RatiosTrainingPanelProps) {
	const dl = settings.dualLoop;
	const subs = getSubdivisionsForMeter(settings.timeSignature.beatUnit);

	// The link is enforced here, at write time, so the rest of the app keeps
	// reading loop2.beats as a plain number.
	const updateLoop = (which: 1 | 2, patch: Partial<LoopConfig>) => {
		const key = which === 1 ? "loop1" : "loop2";
		updateSettings({
			dualLoop: applyLoopLink({ ...dl, [key]: { ...dl[key], ...patch } }),
		});
	};

	const n1 =
		SUBDIVISIONS.find((s) => s.id === dl.loop1.subdivision)?.notesPerBeat ?? 1;
	const n2 =
		SUBDIVISIONS.find((s) => s.id === dl.loop2.subdivision)?.notesPerBeat ?? 1;
	// Linked: loop 1 moves in whole link-steps, loop 2 is derived and read-only.
	const step1 = dl.linkLoops ? loop1Step(n1, n2) : 1;
	const beats1 = isPlaying && liveSet ? liveSet.loop1Beats : dl.loop1.beats;
	const beats2 = isPlaying && liveSet ? liveSet.loop2Beats : dl.loop2.beats;
	const gcdVal = (() => {
		const g = (a: number, b: number): number => (b ? g(b, a % b) : a);
		return g(n1, n2) || 1;
	})();
	const nps1 = (settings.dualLoop.bpm * n1) / 60;
	const nps2 = (settings.dualLoop.bpm * n2) / 60;

	// Tick grids per loop
	const countInBeats =
		visualRound <= 1 && liveSetIndex === 0 ? dl.initialCountIn : dl.repeatCountIn;
	const mkTicks = (beats: number, n: number, phase: string, offset: number) => {
		const out: {
			height: number;
			phase: string;
			active: boolean;
			marginLeft: number;
		}[] = [];
		for (let b = 0; b < beats; b++) {
			for (let k = 0; k < n; k++) {
				const active = isPlaying && activeDotIndex - offset === b && k === 0;
				out.push({
					height: active ? 34 : k === 0 ? 22 : 13,
					phase,
					active,
					marginLeft: k === 0 && b > 0 ? 9 : 0,
				});
			}
		}
		return out;
	};
	const grid1 = mkTicks(beats1, n1, "loop1", countInBeats);
	const grid2 = mkTicks(
		beats2,
		n2,
		"loop2",
		countInBeats + beats1 + dl.restBeats,
	);

	const loop1Opacity = !isPlaying || activeLoop === 1 ? 1 : 0.42;
	const loop2Opacity = !isPlaying || activeLoop === 2 ? 1 : 0.42;

	return (
		<div className="card">
			<div className="card-top-line" />
			<div
				style={{
					display: "flex",
					alignItems: "flex-start",
					justifyContent: "space-between",
					gap: 16,
					marginBottom: 20,
				}}
			>
				<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
					<span className="section-label">Subdivision ratio</span>
					<span
						style={{
							font: "400 10px/1 var(--font-mono)",
							color: "var(--text-dim)",
						}}
					>
						{n1} vs {n2} notes per beat
					</span>
				</div>
				<div
					style={{
						font: "300 34px/1 var(--font-mono)",
						color: "#F2F4F6",
						fontVariantNumeric: "tabular-nums",
					}}
				>
					{n1 / gcdVal} : {n2 / gcdVal}
				</div>
			</div>
			<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
				{/* Loop 1 */}
				<div className="loop-card loop1" style={{ opacity: loop1Opacity }}>
					<div className="loop-card-header">
						<div className="loop-card-label">
							<div className="loop-dot loop1" />
							<span className="section-label section-label-blue">Loop 1</span>
						</div>
						<span className="loop-nps">{nps1.toFixed(1)} notes/sec</span>
					</div>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 10,
							flexWrap: "wrap",
						}}
					>
						<div
							className="custom-select-wrap"
							style={{ flex: "1 1 150px", minWidth: 140 }}
						>
							<select
								className="custom-select"
								value={dl.loop1.subdivision}
								onChange={(e) =>
									updateLoop(1, { subdivision: e.target.value as Subdivision })
								}
								aria-label="Loop 1 subdivision"
							>
								{subs.map((s) => (
									<option key={s.id} value={s.id}>
										{s.label}
									</option>
								))}
							</select>
							<div className="custom-select-arrow">▼</div>
						</div>
						<div className="mini-stepper">
							<button
								className="mini-stepper-btn"
								onClick={() =>
									updateLoop(1, { beats: Math.max(step1, dl.loop1.beats - step1) })
								}
							>
								−
							</button>
							<div className="mini-stepper-value">
								<div className="mini-stepper-num">{beats1}</div>
								<div className="mini-stepper-label">BEATS</div>
							</div>
							<button
								className="mini-stepper-btn"
								onClick={() =>
									updateLoop(1, {
										beats: Math.min(LOOP_BEATS_MAX, dl.loop1.beats + step1),
									})
								}
							>
								+
							</button>
						</div>
					</div>
					<div style={{ marginTop: 14 }}>
						<TickGrid ticks={grid1} maxHeight={34} />
					</div>
				</div>
				{/* Loop 2 */}
				<div className="loop-card loop2" style={{ opacity: loop2Opacity }}>
					<div className="loop-card-header">
						<div className="loop-card-label">
							<div className="loop-dot loop2" />
							<span className="section-label section-label-amber">Loop 2</span>
						</div>
						<span className="loop-nps">{nps2.toFixed(1)} notes/sec</span>
					</div>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 10,
							flexWrap: "wrap",
						}}
					>
						<div
							className="custom-select-wrap"
							style={{ flex: "1 1 150px", minWidth: 140 }}
						>
							<select
								className="custom-select"
								value={dl.loop2.subdivision}
								onChange={(e) =>
									updateLoop(2, { subdivision: e.target.value as Subdivision })
								}
								aria-label="Loop 2 subdivision"
							>
								{subs.map((s) => (
									<option key={s.id} value={s.id}>
										{s.label}
									</option>
								))}
							</select>
							<div className="custom-select-arrow">▼</div>
						</div>
						<div
							className="mini-stepper"
							style={dl.linkLoops ? { opacity: 0.55 } : undefined}
							title={dl.linkLoops ? "Linked to loop 1: same number of notes" : undefined}
						>
							<button
								className="mini-stepper-btn"
								disabled={dl.linkLoops}
								onClick={() =>
									updateLoop(2, { beats: Math.max(1, dl.loop2.beats - 1) })
								}
							>
								−
							</button>
							<div className="mini-stepper-value">
								<div className="mini-stepper-num">{beats2}</div>
								<div className="mini-stepper-label">
									{dl.linkLoops ? "LINKED" : "BEATS"}
								</div>
							</div>
							<button
								className="mini-stepper-btn"
								disabled={dl.linkLoops}
								onClick={() =>
									updateLoop(2, { beats: Math.min(LOOP_BEATS_MAX, dl.loop2.beats + 1) })
								}
							>
								+
							</button>
						</div>
					</div>
					<div style={{ marginTop: 14 }}>
						<TickGrid ticks={grid2} maxHeight={34} />
					</div>
				</div>
			</div>
		</div>
	);
}
