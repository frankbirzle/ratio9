import { useState, useEffect, useCallback } from "react";
import {
	STORAGE_KEY_SETTINGS,
	SAVE_DEBOUNCE_MS,
	getDefaultSettings,
} from "../config";
import type { AppSettings } from "../types";
import { applyLoopLink } from "../ratioPlan";

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

	// Settings saved before the session-end rework: "∞" was a timer value
	// (durationSec null) rather than a limit mode. Those users wanted an
	// unlimited session, which is now the rounds side of the switch.
	if (result.timer.durationSec === null) {
		result.limitMode = "rounds";
		result.timer = { ...result.timer, durationSec: 120 };
	} else if ((stored as Partial<AppSettings>).limitMode === undefined) {
		result.limitMode = "time";
	}

	// Settings saved before the loop link default on: 4:4 becomes 4:2.
	result.dualLoop = applyLoopLink(result.dualLoop);
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
