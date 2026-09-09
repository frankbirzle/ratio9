interface ToggleProps {
	checked: boolean;
	onChange: (v: boolean) => void;
	label: string;
	disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
	return (
		<div
			className="toggle-row"
			style={disabled ? { opacity: 0.45, cursor: "default" } : undefined}
			aria-disabled={disabled || undefined}
			onClick={() => !disabled && onChange(!checked)}
		>
			<span className="toggle-row-label">{label}</span>
			<div className={`toggle-track ${checked ? "on" : "off"}`}>
				<div className={`toggle-knob ${checked ? "on" : "off"}`} />
			</div>
		</div>
	);
}