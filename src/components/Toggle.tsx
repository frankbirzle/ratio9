interface ToggleProps {
	checked: boolean;
	onChange: (v: boolean) => void;
	label: string;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
	return (
		<div className="toggle-row" onClick={() => onChange(!checked)}>
			<span className="toggle-row-label">{label}</span>
			<div className={`toggle-track ${checked ? "on" : "off"}`}>
				<div className={`toggle-knob ${checked ? "on" : "off"}`} />
			</div>
		</div>
	);
}