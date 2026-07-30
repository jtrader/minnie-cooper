import { useCallback, useEffect, useState } from "react";
import type { BridgeSettings } from "./types";

const STORAGE_KEY = "kraken-bridge-settings";
const TOOL_MAP_KEY = "kraken-bridge-tool-map";

export const DEFAULT_BASE_URL = "http://127.0.0.1:8787";

export type SectionKey = "balances" | "ticker" | "trades";
export type ToolMap = Partial<Record<SectionKey, string>>;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? ({ ...fallback, ...(JSON.parse(raw) as object) } as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useBridgeSettings() {
  const [settings, setSettingsState] = useState<BridgeSettings>({
    baseUrl: DEFAULT_BASE_URL,
    token: "",
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSettingsState(read<BridgeSettings>(STORAGE_KEY, { baseUrl: DEFAULT_BASE_URL, token: "" }));
    setHydrated(true);
  }, []);

  const setSettings = useCallback((next: BridgeSettings) => {
    setSettingsState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
  }, []);

  const clearSettings = useCallback(() => {
    setSettingsState({ baseUrl: DEFAULT_BASE_URL, token: "" });
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const configured = hydrated && settings.baseUrl.trim() !== "" && settings.token.trim() !== "";

  return { settings, setSettings, clearSettings, hydrated, configured };
}

export function useToolMap() {
  const [toolMap, setToolMapState] = useState<ToolMap>({});

  useEffect(() => {
    setToolMapState(read<ToolMap>(TOOL_MAP_KEY, {}));
  }, []);

  const setToolFor = useCallback((section: SectionKey, tool: string) => {
    setToolMapState((prev) => {
      const next = { ...prev, [section]: tool };
      try {
        window.localStorage.setItem(TOOL_MAP_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);

  return { toolMap, setToolFor };
}