import { useRef, useEffect, useCallback, useState } from "react";
import { Styleguide } from "./components/Styleguide";
import { MetronomePanel } from "./components/MetronomePanel";
import { RatiosTrainingPanel } from "./components/RatiosTrainingPanel";
import { SpeedTrainingPanel } from "./components/SpeedTrainingPanel";
import { BpmKnob } from "./components/BpmKnob";
import { LedBar } from "./components/LedBar";
import { SessionCard } from "./components/SessionCard";
import { SetupDrawer } from "./components/SetupDrawer";
import { useToast, ToastContainer } from "./components/Toast";
import { useSettings } from "./hooks/useSettings";
import { useMetronome } from "./hooks/useMetronome";
import { useDualLoop } from "./hooks/useDualLoop";
import { useProgressiveTempo } from "./hooks/useProgressiveTempo";
import { usePresets } from "./hooks/usePresets";
import { useCountdownTimer } from "./hooks/useCountdownTimer";
import { useHashRoute } from "./hooks/useHashRoute";
import { ArticleList, ArticleView } from "./components/Articles";
import { Legal } from "./components/Legal";
import { articles } from "./content/articles";
import { SoundEngine } from "./audio/SoundEngine";
import {
	TIME_SIGNATURES,
	getSubdivisionsForMeter,
	BPM_MIN,
	BPM_MAX,
} from "./config";
import type { Mode, TimeSignaturePreset, Subdivision } from "./types";

function Trainer() {
	// Articles are sorted newest first at module load
	const latestArticle = articles[0];
	const soundEngineRef = useRef(new SoundEngine());
	const { settings, setSettings, updateSettings } = useSettings();
	const { presets, savePreset, deletePreset } = usePresets();
	const { toasts, showToast } = useToast();
	const metronome = useMetronome(soundEngineRef.current, showToast);
	const dualLoop = useDualLoop(soundEngineRef.current, showToast);
	const progressive = useProgressiveTempo(soundEngineRef.current, showToast);
	const [drawerOpen, setDrawerOpen] = useState(false);
	const bloomARef = useRef<HTMLDivElement>(null);
	const bloomBRef = useRef<HTMLDivElement>(null);
	const soundEngineForPreview = soundEngineRef.current;

	const isPlaying =
		settings.mode === "metronome"
			? metronome.isPlaying
			: settings.mode === "ratios-training"
				? dualLoop.isPlaying
				: progressive.isPlaying;

	const stopAll = useCallback(() => {
		metronome.stop();
		dualLoop.stop();
		progressive.stop();
	}, [metronome, dualLoop, progressive]);

	const countdown = useCountdownTimer(() => {
		stopAll();
		showToast("Practice complete", "success");
	});

	// Browsers throttle setTimeout in background tabs, which starves the scheduler's
	// lookahead loop. The scheduler's catch-up guard keeps that from firing a burst of
	// past-due beats, but the click still stutters and rounds stop tracking real time,
	// so stop outright rather than hand back a drill that silently lost beats.
	useEffect(() => {
		const onVisibilityChange = () => {
			if (!document.hidden || !isPlaying) return;
			stopAll();
			showToast("Stopped: background tabs throttle the click", "accent");
		};
		document.addEventListener("visibilitychange", onVisibilityChange);
		return () =>
			document.removeEventListener("visibilitychange", onVisibilityChange);
	}, [isPlaying, stopAll, showToast]);

	useEffect(() => {
		if (isPlaying && settings.mode === "ratios-training") {
			const phase = dualLoop.phase;
			const el = phase === "loop2" ? bloomBRef.current : bloomARef.current;
			if (
				el &&
				!window.matchMedia("(prefers-reduced-motion: reduce)").matches
			) {
				el.getAnimations().forEach((a) => a.cancel());
				el.animate(
					[
						{ opacity: 0.9, transform: "scale(1.06)" },
						{ opacity: 0.5, transform: "scale(1)" },
					],
					{ duration: 480, easing: "cubic-bezier(.2,.7,.2,1)" },
				);
			}
		} else if (isPlaying) {
			const el = bloomARef.current;
			if (
				el &&
				!window.matchMedia("(prefers-reduced-motion: reduce)").matches
			) {
				el.getAnimations().forEach((a) => a.cancel());
				el.animate(
					[
						{ opacity: 0.9, transform: "scale(1.06)" },
						{ opacity: 0.5, transform: "scale(1)" },
					],
					{ duration: 480, easing: "cubic-bezier(.2,.7,.2,1)" },
				);
			}
		}
	}, [
		isPlaying,
		dualLoop.phase,
		metronome.currentBeat,
		progressive.currentBeat,
	]); // eslint-disable-line

	useEffect(() => {
		metronome.setSettings(settings);
		dualLoop.setSettings(settings);
		progressive.setSettings(settings);
		soundEngineRef.current.setVolumeTiers(
			settings.sound.volumeAccent / 100,
			settings.sound.volumeNormal / 100,
			settings.sound.volumeSubdivision / 100,
		);
	}, [settings]); // eslint-disable-line

	// The countdown only runs when time is the session's end condition, so it
	// can never cut a rounds-limited session short.
	const isTimed = settings.limitMode === "time";
	const timerDuration = settings.timer.durationSec ?? 0;
	useEffect(() => {
		if (isPlaying && isTimed && timerDuration > 0)
			countdown.start(timerDuration);
		else if (!isPlaying || !isTimed) countdown.stop();
	}, [isPlaying, isTimed, timerDuration]); // eslint-disable-line

	const handleModeChange = (mode: Mode) => {
		stopAll();
		updateSettings({ mode });
	};
	const handleToggle = () => {
		if (settings.mode === "metronome") metronome.toggle();
		else if (settings.mode === "ratios-training") dualLoop.toggle();
		else if (settings.mode === "speed-training") progressive.toggle();
	};

	const handleTimeSignatureChange = (preset: TimeSignaturePreset) => {
		if (preset === "custom") {
			updateSettings({
				timeSignature: { ...settings.timeSignature, preset: "custom" },
			});
			return;
		}
		const ts = TIME_SIGNATURES.find((t) => t.preset === preset);
		if (!ts) return;
		const validSubs = getSubdivisionsForMeter(ts.beatUnit);
		const isValid = (sub: Subdivision) => validSubs.some((s) => s.id === sub);
		const fallback = validSubs[0]?.id ?? "eighth";
		updateSettings({
			timeSignature: {
				preset,
				beatsPerBar: ts.beatsPerBar,
				beatUnit: ts.beatUnit,
				accentGrouping: ts.defaultAccent,
			},
			metronomeSubdivision: isValid(settings.metronomeSubdivision)
				? settings.metronomeSubdivision
				: (fallback as Subdivision),
			dualLoop: {
				...settings.dualLoop,
				loop1: {
					...settings.dualLoop.loop1,
					subdivision: isValid(settings.dualLoop.loop1.subdivision)
						? settings.dualLoop.loop1.subdivision
						: (fallback as Subdivision),
				},
				loop2: {
					...settings.dualLoop.loop2,
					subdivision: isValid(settings.dualLoop.loop2.subdivision)
						? settings.dualLoop.loop2.subdivision
						: (fallback as Subdivision),
				},
			},
			progressive: {
				...settings.progressive,
				subdivision: isValid(settings.progressive.subdivision)
					? settings.progressive.subdivision
					: (fallback as Subdivision),
			},
		});
	};

	// BPM value for the knob
	const knobBpm =
		settings.mode === "speed-training"
			? isPlaying
				? progressive.currentBpm
				: settings.progressive.startBpm
			: settings.mode === "ratios-training"
				? settings.dualLoop.bpm
				: settings.metronomeBpm;

	const onKnobChange = (v: number) => {
		if (settings.mode === "metronome") updateSettings({ metronomeBpm: v });
		else if (settings.mode === "ratios-training")
			updateSettings({ dualLoop: { ...settings.dualLoop, bpm: v } });
		else if (settings.mode === "speed-training")
			updateSettings({
				progressive: {
					...settings.progressive,
					startBpm: Math.min(v, settings.progressive.endBpm),
				},
			});
	};

	// LED bar for the knob card
	const knobLeds = (() => {
		const segs = (() => {
			if (settings.mode === "ratios-training") {
				const ci =
					dualLoop.visualRound <= 1
						? settings.dualLoop.initialCountIn
						: settings.dualLoop.repeatCountIn;
				const out: { phase: string }[] = [];
				for (let i = 0; i < ci; i++) out.push({ phase: "countin" });
				for (let i = 0; i < settings.dualLoop.loop1.beats; i++)
					out.push({ phase: "loop1" });
				for (let i = 0; i < settings.dualLoop.restBeats; i++)
					out.push({ phase: "rest" });
				for (let i = 0; i < settings.dualLoop.loop2.beats; i++)
					out.push({ phase: "loop2" });
				return out;
			}
			return Array.from({ length: settings.timeSignature.beatsPerBar }, () => ({
				phase: "bar",
			}));
		})();
		return segs.map((seg, i) => ({
			phase: seg.phase,
			active:
				isPlaying &&
				(settings.mode === "ratios-training"
					? dualLoop.activeDotIndex === i
					: settings.mode === "speed-training"
						? progressive.currentBeat === i
						: metronome.currentBeat === i),
		}));
	})();

	// Session info
	// Session readout, shown inside the tempo card under the LED divider
	const meterText =
		settings.mode === "ratios-training"
			? `${
					dualLoop.visualRound <= 1
						? settings.dualLoop.initialCountIn
						: settings.dualLoop.repeatCountIn
				} count-in · ${settings.dualLoop.loop1.beats}+${settings.dualLoop.restBeats}+${settings.dualLoop.loop2.beats}`
			: settings.timeSignature.preset;

	const timed = isTimed;
	const timerSec = timerDuration;
	const showRemaining = isPlaying && timed && countdown.remainingSec !== null;
	const sessionTime = (() => {
		if (!timed) return "--:--";
		const sec = showRemaining ? countdown.remainingSec : timerSec;
		if (sec === null) return "--:--";
		return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(
			Math.floor(sec % 60),
		).padStart(2, "0")}`;
	})();
	const sessionTimeLabel = timed
		? showRemaining
			? "REMAINING"
			: "SESSION"
		: "NO LIMIT";

	const roundText =
		settings.mode === "ratios-training"
			? timed
				? `Round ${Math.max(dualLoop.currentRound, 1)}`
				: `Round ${Math.min(Math.max(dualLoop.currentRound, 1), settings.dualLoop.rounds)} / ${settings.dualLoop.rounds}`
			: settings.mode === "speed-training"
				? `${knobBpm} → ${settings.progressive.endBpm} bpm`
				: `${settings.timeSignature.preset} · ${settings.metronomeBpm} bpm`;
	// In timed mode the duration is the setting, so the estimate shows it
	// rather than a computed guess.
	const estText = timed
		? `${Math.round(timerSec / 60)}m session`
		: settings.mode === "ratios-training"
			? (() => {
					const dl = settings.dualLoop;
					const perFirst =
						dl.initialCountIn + dl.loop1.beats + dl.restBeats + dl.loop2.beats;
					const perNext =
						dl.repeatCountIn + dl.loop1.beats + dl.restBeats + dl.loop2.beats;
					const total = perFirst + (dl.rounds - 1) * perNext;
					const sec = total / (dl.bpm / 60);
					return `≈ ${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`;
				})()
			: settings.mode === "speed-training"
				? (() => {
						const p = settings.progressive;
						const steps = Math.max(
							1,
							Math.ceil((p.endBpm - p.startBpm) / p.stepSize) + 1,
						);
						const estBeatsPerStep =
							p.barsPerStep * settings.timeSignature.beatsPerBar;
						const estTotalBeats = steps * estBeatsPerStep;
						const estAvgBpm = (p.startBpm + p.endBpm) / 2;
						const sec = estTotalBeats / (estAvgBpm / 60);
						return `≈ ${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`;
					})()
				: "";

	// Timer ring percentage for knob. Only drawn in timed mode.
	const timerPct =
		isPlaying && timed && timerSec > 0 && countdown.remainingSec !== null
			? (countdown.remainingSec / timerSec) * 100
			: null;

	// Caption under the session-end switch for the modes without rounds
	const roundsCaption =
		settings.mode === "speed-training"
			? (() => {
					const p = settings.progressive;
					const steps = Math.max(
						1,
						Math.ceil((p.endBpm - p.startBpm) / p.stepSize) + 1,
					);
					return `${p.startBpm} → ${p.endBpm} bpm · ${steps} steps of ${p.barsPerStep} bars`;
				})()
			: "Runs until you stop it";

	// Keyboard (D23)
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			const tag = (e.target as HTMLElement)?.tagName;
			if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
			switch (e.code) {
				case "Space":
					e.preventDefault();
					handleToggle();
					break;
				case "Digit1":
					handleModeChange("metronome");
					break;
				case "Digit2":
					handleModeChange("speed-training");
					break;
				case "Digit3":
					handleModeChange("ratios-training");
					break;
				case "KeyT": {
					if (settings.mode === "metronome") {
						const bpm = metronome.tapTempo();
						if (bpm) updateSettings({ metronomeBpm: bpm });
					} else if (settings.mode === "speed-training") {
						const bpm = progressive.tapTempo();
						if (bpm)
							updateSettings({
								progressive: { ...settings.progressive, startBpm: bpm },
							});
					} else if (settings.mode === "ratios-training") {
						const bpm = dualLoop.tapTempo();
						if (bpm)
							updateSettings({
								dualLoop: { ...settings.dualLoop, bpm },
							});
					}
					break;
				}
				case "KeyS":
					setDrawerOpen(true);
					break;
				case "ArrowLeft":
					if (settings.mode === "metronome")
						updateSettings({
							metronomeBpm: Math.max(BPM_MIN, settings.metronomeBpm - 1),
						});
					else if (settings.mode === "ratios-training")
						updateSettings({
							dualLoop: {
								...settings.dualLoop,
								bpm: Math.max(BPM_MIN, settings.dualLoop.bpm - 1),
							},
						});
					else
						updateSettings({
							progressive: {
								...settings.progressive,
								startBpm: Math.max(BPM_MIN, settings.progressive.startBpm - 1),
							},
						});
					break;
				case "ArrowRight":
					if (settings.mode === "metronome")
						updateSettings({
							metronomeBpm: Math.min(BPM_MAX, settings.metronomeBpm + 1),
						});
					else if (settings.mode === "ratios-training")
						updateSettings({
							dualLoop: {
								...settings.dualLoop,
								bpm: Math.min(BPM_MAX, settings.dualLoop.bpm + 1),
							},
						});
					else
						updateSettings({
							progressive: {
								...settings.progressive,
								startBpm: Math.min(
									settings.progressive.endBpm,
									settings.progressive.startBpm + 1,
								),
							},
						});
					break;
				case "Escape":
					setDrawerOpen(false);
					break;
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [settings, handleToggle, updateSettings]); // eslint-disable-line

	return (
		<div className="app-root">
			<div className="bloom bloom-a" ref={bloomARef} />
			<div className="bloom bloom-b" ref={bloomBRef} />
			<div className="bloom-sheen" />

			<div className="app-content">
				{/* Header */}
				<header className="app-header">
					<div className="logo">
						<div className="logo-icon">
							<svg
								className="logo-mark"
								viewBox="9 9 46 46"
								role="img"
								aria-label="Ratio·9"
							>
								<rect
									x="9"
									y="30.4"
									width="12.1"
									height="24.6"
									rx="3.9"
									fill="#4CC9F0"
								/>
								<rect
									x="25.9"
									y="21.6"
									width="12.1"
									height="33.4"
									rx="3.9"
									fill="#F5A524"
								/>
								<rect
									x="42.9"
									y="9"
									width="12.1"
									height="46"
									rx="3.9"
									fill="#FFC15E"
								/>
							</svg>
						</div>
						<div>
							<div className="logo-name">
								Ratio<span style={{ color: "var(--accent)" }}>·</span>9
							</div>
							<div className="logo-sub">Guitar speed trainer</div>
						</div>
					</div>
					<div className="tab-switcher">
						<button
							className={`tab-btn ${settings.mode === "metronome" ? "active" : ""}`}
							onClick={() => handleModeChange("metronome")}
						>
							Metronome
						</button>
						<button
							className={`tab-btn ${settings.mode === "speed-training" ? "active" : ""}`}
							onClick={() => handleModeChange("speed-training")}
						>
							Speed
						</button>
						<button
							className={`tab-btn ${settings.mode === "ratios-training" ? "active" : ""}`}
							onClick={() => handleModeChange("ratios-training")}
						>
							Ratios
						</button>
					</div>
					<div className="header-actions">
						<a href="#/articles" className="manual-link">
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.7"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H5.5A1.5 1.5 0 0 1 4 16.5z" />
								<path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H14a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h4.5a1.5 1.5 0 0 0 1.5-1.5z" />
							</svg>
							Field manual
						</a>
						<button className="setup-btn" onClick={() => setDrawerOpen(true)}>
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.8"
								strokeLinecap="round"
							>
								<path d="M4 8h10M18 8h2M4 16h4M12 16h8" />
								<circle cx="16" cy="8" r="2" />
								<circle cx="10" cy="16" r="2" />
							</svg>
							Setup
						</button>
					</div>
				</header>

				{/* Main grid */}
				<div className="main-grid">
					{/* Knob card */}
					<section className="card">
						<div className="card-top-line" />
						<div
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								marginBottom: 6,
							}}
						>
							<span className="section-label">Tempo</span>
							<span
								style={{
									font: "400 10px/1 var(--font-mono)",
									letterSpacing: ".14em",
									color: "var(--text-muted)",
									textTransform: "uppercase",
								}}
							>
								{isPlaying ? "Running" : "Ready"}
							</span>
						</div>
						<BpmKnob
							value={knobBpm}
							onChange={onKnobChange}
							timerPct={timerPct}
							isPlaying={isPlaying}
							onToggle={handleToggle}
						/>
						<div className="knob-controls">
							<button
								className="knob-btn"
								onClick={() => onKnobChange(Math.max(BPM_MIN, knobBpm - 1))}
							>
								−
							</button>
							<button
								className="knob-btn wide"
								onClick={() => {
									if (settings.mode === "metronome") {
										const bpm = metronome.tapTempo();
										if (bpm) updateSettings({ metronomeBpm: bpm });
									} else if (settings.mode === "speed-training") {
										const bpm = progressive.tapTempo();
										if (bpm)
											updateSettings({
												progressive: { ...settings.progressive, startBpm: bpm },
											});
									} else if (settings.mode === "ratios-training") {
										const bpm = dualLoop.tapTempo();
										if (bpm)
											updateSettings({
												dualLoop: { ...settings.dualLoop, bpm },
											});
									}
								}}
							>
								Tap
							</button>
							<button
								className="knob-btn"
								onClick={() => onKnobChange(Math.min(BPM_MAX, knobBpm + 1))}
							>
								+
							</button>
						</div>
						<div
							style={{
								marginTop: 18,
								paddingTop: 16,
								borderTop: "1px solid #212529",
							}}
						>
							<div className="tempo-session">
								<div className="tempo-session-left">
									<span className="section-label">{roundText || "Bar"}</span>
									<span className="tempo-session-meter">{meterText}</span>
								</div>
								<div className="tempo-session-right">
									<span
										className={`tempo-session-time${showRemaining ? " active" : ""}`}
									>
										{sessionTime}
									</span>
									<span className="tempo-session-label">{sessionTimeLabel}</span>
								</div>
							</div>
							<LedBar leds={knobLeds} />
						</div>
					</section>

					{/* Mode panel column */}
					<section className="mode-col">
						{settings.mode === "metronome" && (
							<MetronomePanel
								settings={settings}
								updateSettings={updateSettings}
								isPlaying={metronome.isPlaying}
								currentBeat={metronome.currentBeat}
							/>
						)}
						{settings.mode === "ratios-training" && (
							<RatiosTrainingPanel
								settings={settings}
								updateSettings={updateSettings}
								isPlaying={dualLoop.isPlaying}
								activeLoop={dualLoop.activeLoop}
								activeDotIndex={dualLoop.activeDotIndex}
								visualRound={dualLoop.visualRound}
							/>
						)}
						{settings.mode === "speed-training" && (
							<SpeedTrainingPanel
								settings={settings}
								updateSettings={updateSettings}
								isPlaying={progressive.isPlaying}
								currentBeat={progressive.currentBeat}
								currentBpm={progressive.currentBpm}
							/>
						)}
						<SessionCard
							mode={settings.mode}
							limitMode={settings.limitMode}
							onLimitModeChange={(m) => {
								stopAll();
								updateSettings({ limitMode: m });
							}}
							rounds={settings.dualLoop.rounds}
							onRoundsChange={(v) =>
								updateSettings({
									dualLoop: { ...settings.dualLoop, rounds: v },
								})
							}
							timerSec={timerSec}
							estText={estText}
							roundsCaption={roundsCaption}
							onTimerChange={(v) =>
								updateSettings({ timer: { durationSec: v } })
							}
						/>
					</section>
				</div>

				{/* Latest note */}
				{latestArticle && (
					<a href={`#/articles/${latestArticle.slug}`} className="latest-note">
						<span className="latest-note-label">Latest note</span>
						<span className="latest-note-rule" />
						<span className="latest-note-title">{latestArticle.title}</span>
						<span className="latest-note-meta">
							{latestArticle.tags[0]?.toUpperCase()} ·{" "}
							{latestArticle.readingMinutes} MIN
						</span>
						<span className="latest-note-arrow">→</span>
					</a>
				)}

				{/* Footer */}
				<footer className="app-footer">
					<span className="footer-hints">
						Space — start · 1 2 3 — mode · T — tap · ← → — tempo
					</span>
					<div className="footer-links">
						<a
							href="https://github.com/frankbirzle/ratio9"
							target="_blank"
							rel="noopener noreferrer"
							className="footer-link"
						>
							<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
								<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
							</svg>
							GitHub
						</a>
						<a href="#/legal" className="footer-link">Imprint &amp; privacy</a>
						<a
							href="https://github.com/frankbirzle/ratio9/blob/main/LICENSE"
							target="_blank"
							rel="noopener noreferrer"
							className="footer-link"
						>
							MIT License
						</a>
					</div>
				</footer>
			</div>

			{/* Setup drawer */}
			<SetupDrawer
				open={drawerOpen}
				onClose={() => setDrawerOpen(false)}
				settings={settings}
				updateSettings={updateSettings}
				onTimeSignatureChange={handleTimeSignatureChange}
				presets={presets}
				onSavePreset={(name) => {
					savePreset(name, settings);
					showToast("Preset saved", "success");
				}}
				onLoadPreset={(p) => {
					stopAll();
					setSettings(p.settings);
					showToast(`Loaded: ${p.name}`);
				}}
				onDeletePreset={deletePreset}
				soundEngine={soundEngineForPreview}
			/>

			<ToastContainer toasts={toasts} />
		</div>
	);
}

export default function App() {
	const route = useHashRoute();

	if (
		typeof window !== "undefined" &&
		window.location.pathname === "/styleguide"
	) {
		return <Styleguide />;
	}

	if (route.name === "app") return <Trainer />;

	return (
		<div className="app-root">
			<div className="bloom bloom-a" />
			<div className="bloom bloom-b" />
			<div className="bloom-sheen" />
			<div className="app-content">
				{route.name === "articles" ? (
					<ArticleList />
				) : route.name === "legal" ? (
					<Legal />
				) : (
					<ArticleView slug={route.slug} />
				)}
			</div>
		</div>
	);
}
