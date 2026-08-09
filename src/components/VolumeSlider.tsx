import { useRef } from "react";

interface VolumeSliderProps {
	label: string;
	value: number;
	onChange: (v: number) => void;
	variant: "accent" | "normal" | "sub";
}

export function VolumeSlider({ label, value, onChange, variant }: VolumeSliderProps) {
	const trackRef = useRef<HTMLDivElement>(null);

	const apply = (clientX: number) => {
		const el = trackRef.current;
		if (!el) return;
		const r = el.getBoundingClientRect();
		onChange(Math.round(Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * 100));
	};

	const handlePointerDown = (e: React.PointerEvent) => {
		e.preventDefault();
		apply(e.clientX);
		const move = (ev: PointerEvent) => apply(ev.clientX);
		const up = () => {
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", up);
		};
		window.addEventListener("pointermove", move);
		window.addEventListener("pointerup", up);
	};

	return (
		<div>
			<div className="vol-slider-row">
				<span className="vol-slider-label">{label}</span>
				<span className="vol-slider-val">{value}</span>
			</div>
			<div className="vol-slider-track" ref={trackRef} onPointerDown={handlePointerDown}>
				<div className={`vol-slider-fill ${variant}`} style={{ width: `${value}%` }} />
			</div>
		</div>
	);
}