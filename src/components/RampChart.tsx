interface RampChartProps {
	bars: { heightPct: number; done: boolean }[];
}

export function RampChart({ bars }: RampChartProps) {
	return (
		<div className="ramp-chart">
			{bars.map((b, i) => (
				<div
					key={i}
					className={`ramp-bar ${b.done ? "done" : ""}`}
					style={{ height: `${b.heightPct}%` }}
				/>
			))}
		</div>
	);
}