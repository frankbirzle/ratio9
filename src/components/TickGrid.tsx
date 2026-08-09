interface TickGridProps {
	ticks: { height: number; phase: string; active: boolean; marginLeft: number }[];
	maxHeight?: number;
}

export function TickGrid({ ticks, maxHeight = 34 }: TickGridProps) {
	return (
		<div className="tick-grid" style={{ height: maxHeight }}>
			{ticks.map((t, i) => (
				<div
					key={i}
					className={`tick ${t.active ? `active-${t.phase}` : `dim-${t.phase}`}`}
					style={{ height: t.height, marginLeft: t.marginLeft > 0 ? t.marginLeft : undefined }}
				/>
			))}
		</div>
	);
}