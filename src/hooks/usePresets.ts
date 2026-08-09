import { useState, useCallback } from "react";
import { STORAGE_KEY_PRESETS, MAX_PRESETS } from "../config";
import type { Preset, AppSettings } from "../types";

export function usePresets() {
	const [presets, setPresets] = useState<Preset[]>(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY_PRESETS);
			return stored ? JSON.parse(stored) : [];
		} catch {
			return [];
		}
	});

	const persist = (list: Preset[]) => {
		try {
			localStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(list));
		} catch (e) {
			console.warn("localStorage write failed:", e);
		}
	};

	const savePreset = useCallback(
		(name: string, settings: AppSettings): Preset => {
			const preset: Preset = {
				id: crypto.randomUUID(),
				name,
				createdAt: Date.now(),
				settings: { ...settings },
			};
			setPresets((prev) => {
				const updated = [preset, ...prev].slice(0, MAX_PRESETS);
				persist(updated);
				return updated;
			});
			return preset;
		},
		[],
	);

	const deletePreset = useCallback((id: string) => {
		setPresets((prev) => {
			const updated = prev.filter((p) => p.id !== id);
			persist(updated);
			return updated;
		});
	}, []);

	return { presets, savePreset, deletePreset };
}
