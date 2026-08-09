interface LedBarProps {
	leds: { phase: string; active: boolean }[];
}

export function LedBar({ leds }: LedBarProps) {
	return (
		<div className="led-bar">
			{leds.map((led, i) => {
				const cls = led.active ? `led on-${led.phase}` : `led dim-${led.phase}`;
				return <div key={i} className={cls} />;
			})}
		</div>
	);
}