import { useState, useCallback } from "react";

export interface ToastItem {
	id: string;
	message: string;
	type: "accent" | "danger" | "success";
}

export function useToast() {
	const [toasts, setToasts] = useState<ToastItem[]>([]);
	const showToast = useCallback(
		(message: string, type: ToastItem["type"] = "accent") => {
			const id = `${Date.now()}-${Math.random()}`;
			setToasts((prev) => [...prev, { id, message, type }]);
			setTimeout(
				() => setToasts((prev) => prev.filter((t) => t.id !== id)),
				2500,
			);
		},
		[],
	);
	return { toasts, showToast };
}

export function ToastContainer({ toasts }: { toasts: ToastItem[] }) {
	return (
		<div className="toast-container">
			{toasts.map((t) => (
				<div key={t.id} className={`toast ${t.type}`}>
					{t.message}
				</div>
			))}
		</div>
	);
}
