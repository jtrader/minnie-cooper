import { BridgeError, type BridgeSettings } from "./types";

export type CurvePoint = { t: number; price: number };

export type StopLossPlan = {
  id: string;
  pair: string;
  volume?: number;
  points: CurvePoint[];
  dryRun: boolean;
  status: "active" | "triggered" | "cancelled" | "error";
  createdAt: number;
  updatedAt: number;
  triggeredAt?: number;
  lastCheckedAt?: number;
  lastMarketPrice?: number;
  lastCurvePrice?: number;
  lastError?: string;
  orderResult?: unknown;
};

export type CreatePlanInput = {
  pair: string;
  points: CurvePoint[];
  volume?: number;
  dryRun?: boolean;
};

const trimUrl = (url: string) => url.replace(/\/+$/, "");

async function bridgeFetch(
  settings: BridgeSettings,
  path: string,
  init?: RequestInit,
): Promise<unknown> {
  const url = `${trimUrl(settings.baseUrl)}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${settings.token}`,
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new BridgeError(
      "network",
      `Could not reach the bridge at ${url}. The kraken-bridge only listens on localhost, so it must be running on this same machine.`,
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new BridgeError(
      "unauthorized",
      "The bridge rejected your bearer token (401). Re-check the token in Settings.",
      response.status,
    );
  }

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    const detail =
      parsed && typeof parsed === "object" && "error" in parsed
        ? String((parsed as { error: unknown }).error)
        : typeof parsed === "string" && parsed
          ? parsed.slice(0, 300)
          : `HTTP ${response.status}`;
    throw new BridgeError("http", detail, response.status);
  }

  return parsed;
}

export async function listStopLossPlans(settings: BridgeSettings): Promise<StopLossPlan[]> {
  const data = (await bridgeFetch(settings, "/stoploss", { method: "GET" })) as {
    plans?: StopLossPlan[];
  } | null;
  return Array.isArray(data?.plans) ? data.plans : [];
}

export async function createStopLossPlan(
  settings: BridgeSettings,
  input: CreatePlanInput,
): Promise<StopLossPlan> {
  return (await bridgeFetch(settings, "/stoploss", {
    method: "POST",
    body: JSON.stringify({ dryRun: true, ...input }),
  })) as StopLossPlan;
}

export async function getStopLossPlan(
  settings: BridgeSettings,
  id: string,
): Promise<StopLossPlan> {
  return (await bridgeFetch(settings, `/stoploss/${encodeURIComponent(id)}`, {
    method: "GET",
  })) as StopLossPlan;
}

export async function cancelStopLossPlan(
  settings: BridgeSettings,
  id: string,
): Promise<StopLossPlan> {
  return (await bridgeFetch(settings, `/stoploss/${encodeURIComponent(id)}`, {
    method: "DELETE",
  })) as StopLossPlan;
}

/** Linear interpolation of the curve at time `t` (flat before first / after last). */
export function curvePriceAt(points: CurvePoint[], t: number): number | null {
  if (points.length === 0) return null;
  const sorted = [...points].sort((a, b) => a.t - b.t);
  if (t <= sorted[0].t) return sorted[0].price;
  const last = sorted[sorted.length - 1];
  if (t >= last.t) return last.price;
  for (let i = 1; i < sorted.length; i += 1) {
    const a = sorted[i - 1];
    const b = sorted[i];
    if (t <= b.t) {
      const span = b.t - a.t;
      if (span <= 0) return b.price;
      return a.price + ((t - a.t) / span) * (b.price - a.price);
    }
  }
  return last.price;
}
