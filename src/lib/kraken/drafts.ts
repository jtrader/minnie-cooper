import type { CurvePoint, EllipseAnnotation } from "./stoploss";

export type StopLossDraft = {
  points: CurvePoint[];
  hours: number;
  annotations: EllipseAnnotation[];
};

export const DEFAULT_HOURS = 6;
const DRAFT_PREFIX = "stoploss-draft:";
const TIMEFRAME_KEY = "stoploss-timeframe";

const draftKey = (pair: string) => `${DRAFT_PREFIX}${pair}`;

function isAnnotation(value: unknown): value is EllipseAnnotation {
  if (!value || typeof value !== "object") return false;
  const a = value as Record<string, unknown>;
  return (
    typeof a.id === "string" &&
    ["ct", "cprice", "rt", "rprice"].every(
      (k) => typeof a[k] === "number" && Number.isFinite(a[k] as number),
    )
  );
}

export function loadDraft(pair: string): StopLossDraft {
  const empty: StopLossDraft = { points: [], hours: DEFAULT_HOURS, annotations: [] };
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(draftKey(pair));
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<StopLossDraft>;
    const points = Array.isArray(parsed.points)
      ? parsed.points.filter(
          (p): p is CurvePoint =>
            typeof p?.t === "number" && typeof p?.price === "number" && Number.isFinite(p.price),
        )
      : [];
    const hours = typeof parsed.hours === "number" && parsed.hours > 0 ? parsed.hours : DEFAULT_HOURS;
    const annotations = Array.isArray(parsed.annotations)
      ? parsed.annotations.filter(isAnnotation)
      : [];
    return { points, hours, annotations };
  } catch {
    return empty;
  }
}

export function saveDraft(pair: string, draft: StopLossDraft): void {
  if (typeof window === "undefined") return;
  try {
    if (draft.points.length === 0 && draft.annotations.length === 0) {
      window.localStorage.removeItem(draftKey(pair));
      return;
    }
    window.localStorage.setItem(draftKey(pair), JSON.stringify(draft));
  } catch {
    /* storage unavailable */
  }
}

export function clearDraft(pair: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(draftKey(pair));
  } catch {
    /* storage unavailable */
  }
}

export function listDraftPairs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const pairs: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(DRAFT_PREFIX)) pairs.push(key.slice(DRAFT_PREFIX.length));
    }
    return pairs;
  } catch {
    return [];
  }
}

export type ChartTimeframe = "5" | "15" | "60";
export const TIMEFRAMES: { label: string; value: ChartTimeframe }[] = [
  { label: "5m", value: "5" },
  { label: "15m", value: "15" },
  { label: "1h", value: "60" },
];

export function loadTimeframe(): ChartTimeframe {
  if (typeof window === "undefined") return "15";
  const raw = window.localStorage.getItem(TIMEFRAME_KEY);
  return raw === "5" || raw === "15" || raw === "60" ? raw : "15";
}

export function saveTimeframe(value: ChartTimeframe): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TIMEFRAME_KEY, value);
  } catch {
    /* storage unavailable */
  }
}

const SELECTED_PAIR_KEY = "stoploss-selected-pair";

export function loadSelectedPair(fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(SELECTED_PAIR_KEY) || fallback;
}

export function saveSelectedPair(pair: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SELECTED_PAIR_KEY, pair);
  } catch {
    /* storage unavailable */
  }
}

const DRAWER_KEY_PREFIX = "stoploss-drawer:";

export type DrawerSide = "markets" | "objects";

/** Collapsed state for a side drawer. Global (not per-pair), like the timeframe. */
export function loadDrawerCollapsed(side: DrawerSide): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(`${DRAWER_KEY_PREFIX}${side}`) === "collapsed";
  } catch {
    return false;
  }
}

export function saveDrawerCollapsed(side: DrawerSide, collapsed: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${DRAWER_KEY_PREFIX}${side}`, collapsed ? "collapsed" : "open");
  } catch {
    /* storage unavailable */
  }
}
