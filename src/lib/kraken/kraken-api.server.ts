import { createHash, createHmac } from "crypto";

const API_URL = "https://api.kraken.com";

export type KrakenBalanceRow = { asset: string; amount: number };
export type KrakenTicker = {
  pair: string;
  price: number | null;
  changePct: number | null;
  volume: number | null;
  high: number | null;
  low: number | null;
};
export type KrakenActivityRow = {
  id: string;
  time: number | null;
  pair: string;
  side: string;
  type: string;
  price: number | null;
  size: number | null;
  cost: number | null;
  status: string;
};

export type KrakenErrorKind = "credentials" | "auth" | "network" | "api";

export class KrakenApiError extends Error {
  readonly kind: KrakenErrorKind;
  constructor(kind: KrakenErrorKind, message: string) {
    super(message);
    this.name = "KrakenApiError";
    this.kind = kind;
  }
}

function credentials() {
  const key = process.env.KRAKEN_API_KEY;
  const secret = process.env.KRAKEN_PRIVATE_KEY;
  if (!key || !secret) {
    throw new KrakenApiError(
      "credentials",
      "Kraken API credentials are not configured on the server.",
    );
  }
  return { key, secret };
}

function num(value: unknown): number | null {
  const parsed = typeof value === "string" ? Number(value) : (value as number);
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : null;
}

let lastNonce = 0;

function nextNonce(): string {
  const now = Date.now();
  lastNonce = now > lastNonce ? now : lastNonce + 1;
  return String(lastNonce);
}

function signature(path: string, nonce: string, body: string, secret: string): string {
  const hash = createHash("sha256")
    .update(nonce + body)
    .digest();
  return createHmac("sha512", Buffer.from(secret, "base64"))
    .update(Buffer.concat([Buffer.from(path, "utf8"), hash]))
    .digest("base64");
}

async function readResult(response: Response): Promise<Record<string, unknown>> {
  const payload = (await response.json()) as { error?: string[]; result?: unknown };
  const errors = payload.error ?? [];
  if (errors.length > 0) {
    const message = errors.join("; ");
    const isAuth = /Invalid key|Permission denied|Invalid signature|Invalid nonce/i.test(message);
    throw new KrakenApiError(isAuth ? "auth" : "api", message);
  }
  return (payload.result ?? {}) as Record<string, unknown>;
}

export async function krakenPublic(
  endpoint: string,
  params: Record<string, string> = {},
): Promise<Record<string, unknown>> {
  const query = new URLSearchParams(params).toString();
  const url = `${API_URL}/0/public/${endpoint}${query ? `?${query}` : ""}`;
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new KrakenApiError("network", "Could not reach the Kraken API.");
  }
  return readResult(response);
}

export async function krakenPrivate(
  endpoint: string,
  params: Record<string, string> = {},
): Promise<Record<string, unknown>> {
  const { key, secret } = credentials();
  const path = `/0/private/${endpoint}`;
  const nonce = nextNonce();
  const body = new URLSearchParams({ nonce, ...params }).toString();

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: {
        "API-Key": key,
        "API-Sign": signature(path, nonce, body, secret),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
  } catch {
    throw new KrakenApiError("network", "Could not reach the Kraken API.");
  }
  if (response.status === 401 || response.status === 403) {
    throw new KrakenApiError("auth", "Kraken rejected the API credentials.");
  }
  return readResult(response);
}

export function mapBalances(result: Record<string, unknown>): KrakenBalanceRow[] {
  return Object.entries(result)
    .map(([asset, value]) => ({ asset, amount: num(value) ?? 0 }))
    .filter((row) => row.amount !== 0)
    .sort((a, b) => b.amount - a.amount);
}

export function mapTicker(result: Record<string, unknown>): KrakenTicker[] {
  return Object.entries(result).map(([pair, raw]) => {
    const entry = raw as Record<string, string[] | string>;
    const last = num((entry.c as string[])?.[0]);
    const open = num(entry.o as string);
    return {
      pair,
      price: last,
      changePct: last !== null && open ? ((last - open) / open) * 100 : null,
      volume: num((entry.v as string[])?.[1]),
      high: num((entry.h as string[])?.[1]),
      low: num((entry.l as string[])?.[1]),
    };
  });
}

export function mapTrades(result: Record<string, unknown>): KrakenActivityRow[] {
  const trades = (result.trades ?? {}) as Record<string, Record<string, unknown>>;
  return Object.entries(trades)
    .map(([id, trade]) => ({
      id,
      time: num(trade.time) !== null ? (num(trade.time) as number) * 1000 : null,
      pair: String(trade.pair ?? ""),
      side: String(trade.type ?? ""),
      type: String(trade.ordertype ?? ""),
      price: num(trade.price),
      size: num(trade.vol),
      cost: num(trade.cost),
      status: "closed",
    }))
    .sort((a, b) => (b.time ?? 0) - (a.time ?? 0));
}

export function mapOrders(result: Record<string, unknown>): KrakenActivityRow[] {
  const open = (result.open ?? {}) as Record<string, Record<string, unknown>>;
  return Object.entries(open)
    .map(([id, order]) => {
      const descr = (order.descr ?? {}) as Record<string, unknown>;
      return {
        id,
        time: num(order.opentm) !== null ? (num(order.opentm) as number) * 1000 : null,
        pair: String(descr.pair ?? ""),
        side: String(descr.type ?? ""),
        type: String(descr.ordertype ?? ""),
        price: num(descr.price) ?? num(order.price),
        size: num(order.vol),
        cost: num(order.cost),
        status: String(order.status ?? "open"),
      };
    })
    .sort((a, b) => (b.time ?? 0) - (a.time ?? 0));
}