import { useEffect, useState } from "react";

interface BpmInputProps {
	value: number;
	min: number;
	max: number;
	onCommit: (v: number) => void;
	ariaLabel: string;
}

/**
 * A typed tempo field. The draft is local while the user types and only
 * commits (clamped to min..max) on blur or Enter, so a half-typed "1" on the
 * way to "140" never gets clamped up to the minimum mid-keystroke. Arrow keys
 * nudge by one, Shift+arrow by five. Escape restores the committed value.
 */
export function BpmInput({ value, min, max, onCommit, ariaLabel }: BpmInputProps) {
	const [draft, setDraft] = useState(String(value));
	const [focused, setFocused] = useState(false);

	useEffect(() => {
		if (!focused) setDraft(String(value));
	}, [value, focused]);

	const clamp = (v: number) => Math.max(min, Math.min(max, v));

	const commit = () => {
		const parsed = parseInt(draft, 10);
		const next = Number.isFinite(parsed) ? clamp(parsed) : value;
		onCommit(next);
		setDraft(String(next));
	};

	const nudge = (delta: number) => {
		const base = parseInt(draft, 10);
		const next = clamp((Number.isFinite(base) ? base : value) + delta);
		onCommit(next);
		setDraft(String(next));
	};

	return (
		<label className={`bpm-input${focused ? " focused" : ""}`}>
			<input
				type="text"
				inputMode="numeric"
				pattern="[0-9]*"
				value={draft}
				aria-label={ariaLabel}
				onFocus={(e) => { setFocused(true); e.target.select(); }}
				onBlur={() => { setFocused(false); commit(); }}
				onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
				onKeyDown={(e) => {
					if (e.key === "Enter") { e.currentTarget.blur(); }
					else if (e.key === "Escape") { setDraft(String(value)); e.currentTarget.blur(); }
					else if (e.key === "ArrowUp") { e.preventDefault(); nudge(e.shiftKey ? 5 : 1); }
					else if (e.key === "ArrowDown") { e.preventDefault(); nudge(e.shiftKey ? -5 : -1); }
				}}
			/>
			<span className="bpm-input-unit">bpm</span>
		</label>
	);
}
