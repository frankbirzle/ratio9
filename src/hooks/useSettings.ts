import { useState, useEffect, useCallback } from "react";
import {
	STORAGE_KEY_SETTINGS,
	SAVE_DEBOUNCE_MS,
	getDefaultSettings,
} from "../config";
import type { AppSettings } from "../types";

// Deep merge: one level deep — merges top-level keys and one level of nested objects
function deepMerge(
	defaults: AppSettings,
	stored: Partial<AppSettings>,
): AppSettings {
	const result = { ...defaults };
	for (const key in stored) {
		const storedVal = stored[key as keyof AppSettings];
		const defaultVal = defaults[key as keyof AppSettings];
		if (
			storedVal &&
			typeof storedVal === "object" &&
			!Array.isArray(storedVal) &&
			defaultVal &&
			typeof defaultVal === "object" &&
			!Array.isArray(defaultVal)
		) {
			(result as Record<string, unknown>)[key] = {
				...defaultVal,
				...storedVal,
			};
		} else if (storedVal !== undefined) {
			(result as Record<string, unknown>)[key] = storedVal;
		}
	}
	return result;
}

export function useSettings() {
	const [settings, setSettings] = useState<AppSettings>(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
			return stored
				? deepMerge(
						getDefaultSettings(),
						JSON.parse(stored) as Partial<AppSettings>,
					)
				: getDefaultSettings();
		} catch {
			return getDefaultSettings();
		}
	});

	const updateSettings = useCallback((patch: Partial<AppSettings>) => {
		setSettings((prev) => ({ ...prev, ...patch }));
	}, []);

	useEffect(() => {
		const timer = setTimeout(() => {
			try {
				localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
			} catch (e) {
				console.warn("Save failed:", e);
			}
		}, SAVE_DEBOUNCE_MS);
		return () => clearTimeout(timer);
	}, [settings]);

	return { settings, setSettings, updateSettings };
}
