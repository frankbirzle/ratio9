import { useState } from "react";
import { TIME_SIGNATURES, SOUND_OPTIONS } from "../config";
import type { AppSettings, TimeSignaturePreset, SoundId, Preset } from "../types";
import { VolumeSlider } from "./VolumeSlider";
import { Toggle } from "./Toggle";
import type { SoundEngine } from "../audio/SoundEngine";

interface SetupDrawerProps {
	open: boolean;
	onClose: () => void;
	settings: AppSettings;
	updateSettings: (patch: Partial<AppSettings>) => void;
	onTimeSignatureChange: (preset: TimeSignaturePreset) => void;
	presets: Preset[];
	onSavePreset: (name: string) => void;
	onLoadPreset: (p: Preset) => void;
	onDeletePreset: (id: string) => void;
	soundEngine: SoundEngine;
}

export function SetupDrawer({
	open, onClose, settings, updateSettings, onTimeSignatureChange, presets, onSavePreset, onLoadPreset, onDeletePreset, soundEngine,
}: SetupDrawerProps) {
	const [presetName, setPresetName] = useState("");
	const s = settings;
	const p = s.progressive;
	const dl = s.dualLoop;
	const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

	return (
		<>
			<div className="drawer-scrim" style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }} onClick={onClose} />
			<aside className="drawer" style={{ transform: `translateX(${open ? "0%" : "102%"})` }}>
				<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
					<div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
						<span style={{ font: "600 13px/1 var(--font-ui)", letterSpacing: ".18em", textTransform: "uppercase" }}>Setup</span>
						<span style={{ font: "400 9px/1 var(--font-mono)", letterSpacing: ".18em", color: "var(--text-dim)" }}>Advanced parameters</span>
					</div>
					<button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, cursor: "pointer", background: "#1B1F22", border: "1px solid #2A2E33", color: "var(--text-secondary)", font: "400 15px/1 var(--font-ui)", transition: "all 140ms ease" }}>✕</button>
				</div>

				{/* Mode-specific: Ratios → Loop Cycle */}
				{s.mode === "ratios-training" && (
					<div className="drawer-section">
						<div className="drawer-section-title">Loop cycle</div>
						{/* Rounds lives in the session-end card, since it is a session
						    length decision rather than loop structure. */}
						{[
							{ label: "Rest beats", hint: "Gap to switch licks", val: dl.restBeats, set: (v: number) => updateSettings({ dualLoop: { ...dl, restBeats: clamp(v, 0, 8) } }), lo: 0, hi: 8 },
							{ label: "Count-in · first", hint: "Beats before round 1", val: dl.initialCountIn, set: (v: number) => updateSettings({ dualLoop: { ...dl, initialCountIn: clamp(v, 0, 8) } }), lo: 0, hi: 8 },
							{ label: "Count-in · repeat", hint: "Beats before each round", val: dl.repeatCountIn, set: (v: number) => updateSettings({ dualLoop: { ...dl, repeatCountIn: clamp(v, 0, 8) } }), lo: 0, hi: 8 },
						].map((row) => (
							<div className="drawer-row" key={row.label}>
								<div className="drawer-row-label">
									<span className="drawer-row-name">{row.label}</span>
									<span className="drawer-row-hint">{row.hint}</span>
								</div>
								<div className="mini-stepper">
									<button className="drawer-mini-stepper-btn" onClick={() => row.set(row.val - 1)}>−</button>
									<span className="drawer-mini-stepper-val">{row.val}</span>
									<button className="drawer-mini-stepper-btn" onClick={() => row.set(row.val + 1)}>+</button>
								</div>
							</div>
						))}
					</div>
				)}

				{/* Mode-specific: Speed → Ramp */}
				{s.mode === "speed-training" && (
					<div className="drawer-section">
						<div className="drawer-section-title">Ramp</div>
						{[
							{ label: "Step size", val: p.stepSize, set: (v: number) => updateSettings({ progressive: { ...p, stepSize: clamp(v, 1, 20) } }), lo: 1, hi: 20 },
							{ label: "Bars per step", val: p.barsPerStep, set: (v: number) => updateSettings({ progressive: { ...p, barsPerStep: clamp(v, 1, 16) } }), lo: 1, hi: 16 },
						].map((row) => (
							<div className="drawer-row" key={row.label}>
								<span className="drawer-row-name">{row.label}</span>
								<div className="mini-stepper">
									<button className="drawer-mini-stepper-btn" onClick={() => row.set(row.val - 1)}>−</button>
									<span className="drawer-mini-stepper-val">{row.val}</span>
									<button className="drawer-mini-stepper-btn" onClick={() => row.set(row.val + 1)}>+</button>
								</div>
							</div>
						))}
						{/* Curve type */}
						<div className="drawer-row">
							<span className="drawer-row-name">Curve</span>
							<div className="custom-select-wrap" style={{ minWidth: 120 }}>
								<select className="custom-select" value={p.curve}
									onChange={(e) => updateSettings({ progressive: { ...p, curve: e.target.value as typeof p.curve } })}>
									<option value="linear">Linear</option>
									<option value="logarithmic">Logarithmic</option>
									<option value="stepback">Stepback</option>
									<option value="pyramid">Pyramid</option>
								</select>
								<div className="custom-select-arrow">▼</div>
							</div>
						</div>
					</div>
				)}

				{/* Meter */}
				<div className="drawer-section">
					<div className="drawer-section-title">Meter</div>
					<div className="custom-select-wrap">
						<select className="custom-select" value={s.timeSignature.preset}
							onChange={(e) => onTimeSignatureChange(e.target.value as TimeSignaturePreset)} aria-label="Time signature">
							{TIME_SIGNATURES.map((t) => <option key={t.preset} value={t.preset}>{t.preset}</option>)}
						<option value="custom">Custom</option>
					</select>
					<div className="custom-select-arrow">▼</div>
				</div>
				{s.timeSignature.preset === "custom" && (
					<div className="drawer-row">
						<span className="drawer-row-name">Beats</span>
						<div className="mini-stepper">
							<button className="drawer-mini-stepper-btn" onClick={() => updateSettings({ timeSignature: { ...s.timeSignature, beatsPerBar: clamp(s.timeSignature.beatsPerBar - 1, 2, 12) } })}>−</button>
							<span className="drawer-mini-stepper-val">{s.timeSignature.beatsPerBar}</span>
							<button className="drawer-mini-stepper-btn" onClick={() => updateSettings({ timeSignature: { ...s.timeSignature, beatsPerBar: clamp(s.timeSignature.beatsPerBar + 1, 2, 12) } })}>+</button>
							<select className="custom-select" style={{ width: 60, padding: "6px 8px" }} value={s.timeSignature.beatUnit} onChange={(e) => updateSettings({ timeSignature: { ...s.timeSignature, beatUnit: Number(e.target.value) as 4 | 8 } })}>
								<option value={4}>/4</option>
								<option value={8}>/8</option>
							</select>
						</div>
					</div>
				)}
			</div>

				{/* Sound */}
				<div className="drawer-section">
					<div className="drawer-section-title">Sound</div>
					<div className="custom-select-wrap" style={{ marginBottom: 16 }}>
						<select className="custom-select" value={s.sound.soundId}
							onChange={(e) => updateSettings({ sound: { ...s.sound, soundId: e.target.value as SoundId } })}
							aria-label="Click sound">
							{SOUND_OPTIONS.map((opt) => <option key={opt.id} value={opt.id}>{opt.label} — {opt.description}</option>)}
						</select>
						<div className="custom-select-arrow">▼</div>
					</div>
					<div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
						<VolumeSlider label="Downbeat" value={s.sound.volumeAccent} variant="accent"
							onChange={(v) => updateSettings({ sound: { ...s.sound, volumeAccent: v } })} />
						<VolumeSlider label="Beat" value={s.sound.volumeNormal} variant="normal"
							onChange={(v) => updateSettings({ sound: { ...s.sound, volumeNormal: v } })} />
						<VolumeSlider label="Subdivision" value={s.sound.volumeSubdivision} variant="sub"
							onChange={(v) => updateSettings({ sound: { ...s.sound, volumeSubdivision: v } })} />
						<Toggle label="Subdivision clicks" checked={s.sound.subdivisionClicksOn}
						onChange={(v) => updateSettings({ sound: { ...s.sound, subdivisionClicksOn: v } })} />
					<button className="preset-save-btn" style={{ marginTop: 12, width: "100%" }} onClick={() => { const ctx = soundEngine.context; if (ctx) soundEngine.playClick(ctx.currentTime, "accent", settings.sound.soundId); }}>Preview sound</button>
					</div>
				</div>

				{/* Presets */}
				<div className="drawer-section">
					<div className="drawer-section-title">Presets</div>
					<div className="preset-save-row">
						<input className="preset-input" placeholder="Preset name" value={presetName}
							onChange={(e) => setPresetName(e.target.value)}
							onKeyDown={(e) => { if (e.key === "Enter" && presetName.trim()) { onSavePreset(presetName.trim()); setPresetName(""); } }} />
						<button className="preset-save-btn" onClick={() => { if (presetName.trim()) { onSavePreset(presetName.trim()); setPresetName(""); } }}>Save</button>
					</div>
					<div className="preset-list">
						{presets.map((p) => (
							<div className="preset-item" key={p.id}>
								<span className="preset-item-name" onClick={() => onLoadPreset(p)}>{p.name}</span>
								<button className="preset-delete" onClick={() => onDeletePreset(p.id)}>✕</button>
							</div>
						))}
						{presets.length === 0 && <span style={{ font: "400 12px/1 var(--font-ui)", color: "var(--text-dim)" }}>No saved presets</span>}
					</div>
				</div>
			</aside>
		</>
	);
}