import { useState } from "react";
import { BpmKnob } from "./BpmKnob";
import { LedBar } from "./LedBar";
import { TickGrid } from "./TickGrid";
import { RampChart } from "./RampChart";
import { VolumeSlider } from "./VolumeSlider";
import { Toggle } from "./Toggle";
import { TimerPills } from "./TimerPills";
import { SUBDIVISIONS, SOUND_OPTIONS, TIME_SIGNATURES } from "../config";

export function Styleguide() {
	const [bpm, setBpm] = useState(120);
	const [vol, setVol] = useState(65);
	const [toggle, setToggle] = useState(true);
	const [timer, setTimer] = useState(120);

	const sampleLeds = [
		{ phase: "countin", active: false }, { phase: "countin", active: false },
		{ phase: "loop1", active: true }, { phase: "loop1", active: false },
		{ phase: "rest", active: false }, { phase: "loop2", active: false },
	];
	const sampleTicks = Array.from({ length: 12 }, (_, i) => ({
		height: i === 3 ? 34 : i % 4 === 0 ? 22 : 13,
		phase: "loop1", active: i === 3, marginLeft: i % 4 === 0 && i > 0 ? 9 : 0,
	}));
	const sampleRamp = Array.from({ length: 8 }, (_, i) => ({
		heightPct: 22 + (i / 7) * 78, done: i < 4,
	}));

	return (
		<div className="app-root" style={{ paddingTop: 40 }}>
			<div className="bloom bloom-a" /><div className="bloom bloom-b" /><div className="bloom-sheen" />
			<div className="app-content">
				<h1 style={{ font: "700 28px/1 var(--font-ui)", marginBottom: 24 }}>Ratio·9 Styleguide</h1>

				{/* Color tokens */}
				<div className="card" style={{ marginBottom: 20 }}>
					<div className="card-top-line" />
					<div className="section-label" style={{ marginBottom: 16 }}>Color tokens</div>
					<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
						{[
							["--bg-page", "#08090B"], ["--bg-card-top", "#1A1D21"], ["--bg-card-bottom", "#121517"], ["--bg-inset", "#15181B"],
							["--accent", "#F5A524"], ["--blue", "#4CC9F0"], ["--text-primary", "#E8EAED"],
							["--text-secondary", "#9AA2A9"], ["--text-muted", "#6E767E"], ["--text-dim", "#5F676E"],
							["--border", "#262A2F"], ["--border-input", "#2E3339"],
						].map(([name, val]) => (
							<div key={name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
								<div style={{ width: 20, height: 20, borderRadius: 5, background: val, border: "1px solid #333" }} />
								<div style={{ display: "flex", flexDirection: "column" }}>
									<span style={{ font: "500 11px/1 var(--font-mono)", color: "var(--text-secondary)" }}>{name}</span>
									<span style={{ font: "400 10px/1 var(--font-mono)", color: "var(--text-dim)" }}>{val}</span>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Fonts */}
				<div className="card" style={{ marginBottom: 20 }}>
					<div className="card-top-line" />
					<div className="section-label" style={{ marginBottom: 16 }}>Fonts</div>
					<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
						<div><span style={{ font: "600 18px/1 var(--font-ui)" }}>Space Grotesk — UI</span><br /><span style={{ font: "400 13px/1 var(--font-ui)", color: "var(--text-secondary)" }}>500 12.5px/1 letter-spacing .04em</span></div>
						<div><span style={{ font: "300 42px/1 var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>120 BPM</span><br /><span style={{ font: "400 13px/1 var(--font-ui)", color: "var(--text-secondary)" }}>JetBrains Mono — numerics, tabular-nums</span></div>
					</div>
				</div>

				{/* BpmKnob */}
				<div className="card" style={{ marginBottom: 20 }}>
					<div className="card-top-line" />
					<div className="section-label" style={{ marginBottom: 16 }}>BpmKnob</div>
					<BpmKnob value={bpm} onChange={setBpm} />
					<div style={{ marginTop: 12, font: "400 12px/1 var(--font-mono)", color: "var(--text-dim)" }}>Drag up/down or scroll to change · current: {bpm}</div>
				</div>

				{/* LedBar */}
				<div className="card" style={{ marginBottom: 20 }}>
					<div className="card-top-line" />
					<div className="section-label" style={{ marginBottom: 16 }}>LedBar</div>
					<LedBar leds={sampleLeds} />
				</div>

				{/* TickGrid */}
				<div className="card" style={{ marginBottom: 20 }}>
					<div className="card-top-line" />
					<div className="section-label" style={{ marginBottom: 16 }}>TickGrid</div>
					<TickGrid ticks={sampleTicks} maxHeight={40} />
				</div>

				{/* RampChart */}
				<div className="card" style={{ marginBottom: 20 }}>
					<div className="card-top-line" />
					<div className="section-label" style={{ marginBottom: 16 }}>RampChart</div>
					<RampChart bars={sampleRamp} />
				</div>

				{/* VolumeSlider + Toggle */}
				<div className="card" style={{ marginBottom: 20 }}>
					<div className="card-top-line" />
					<div className="section-label" style={{ marginBottom: 16 }}>VolumeSlider & Toggle</div>
					<VolumeSlider label="Downbeat" value={vol} variant="accent" onChange={setVol} />
					<div style={{ height: 15 }} />
					<VolumeSlider label="Subdivision" value={vol} variant="sub" onChange={setVol} />
					<div style={{ height: 15 }} />
					<Toggle label="Subdivision clicks" checked={toggle} onChange={setToggle} />
				</div>

				{/* TimerPills */}
				<div className="card" style={{ marginBottom: 20 }}>
					<div className="card-top-line" />
					<div className="section-label" style={{ marginBottom: 16 }}>TimerPills</div>
					<TimerPills value={timer} onChange={setTimer} />
				</div>

				{/* Subdivisions + Sounds + Time Sigs */}
				<div className="card" style={{ marginBottom: 20 }}>
					<div className="card-top-line" />
					<div className="section-label" style={{ marginBottom: 16 }}>Data lists</div>
					<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
						<span style={{ font: "400 12px/1 var(--font-mono)", color: "var(--text-secondary)" }}>Subdivisions: {SUBDIVISIONS.map(s => s.label).join(", ")}</span>
						<span style={{ font: "400 12px/1 var(--font-mono)", color: "var(--text-secondary)" }}>Sounds: {SOUND_OPTIONS.map(s => s.label).join(", ")}</span>
						<span style={{ font: "400 12px/1 var(--font-mono)", color: "var(--text-secondary)" }}>Time sigs: {TIME_SIGNATURES.map(t => t.preset).join(", ")}</span>
					</div>
				</div>
			</div>
		</div>
	);
}