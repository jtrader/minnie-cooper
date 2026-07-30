import type { BalanceRow, TickerSnapshot, TradeRow } from "./types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const num = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  if (Array.isArray(value)) return num(value[0]);
  return null;
};

const str = (value: unknown): string | null =>
  typeof value === "string" ? value : typeof value === "number" ? String(value) : null;

/** Kraken responses are often wrapped in { result: ... } or { error: [], result: ... }. */
function unwrap(payload: unknown): unknown {
  let current = payload;
  for (let i = 0; i < 4; i += 1) {
    if (isRecord(current) && "result" in current) {
      current = current.result;
      continue;
    }
    if (isRecord(current) && "data" in current && Object.keys(current).length <= 2) {
      current = current.data;
      continue;
    }
    break;
  }
  return current;
}

export function parseBalances(payload: unknown): BalanceRow[] {
  const data = unwrap(payload);
  const rows: BalanceRow[] = [];

  if (Array.isArray(data)) {
    data.forEach((entry) => {
      if (!isRecord(entry)) return;
      const asset = str(entry.asset ?? entry.currency ?? entry.symbol ?? entry.name);
      const amount = num(entry.amount ?? entry.balance ?? entry.value ?? entry.free);
      if (asset && amount !== null) rows.push({ asset, amount });
    });
    return rows.sort((a, b) => b.amount - a.amount);
  }

  if (isRecord(data)) {
    const source = isRecord(data.balances) ? data.balances : data;
    Object.entries(source).forEach(([asset, raw]) => {
      const amount = num(isRecord(raw) ? (raw.balance ?? raw.amount ?? raw.total) : raw);
      if (amount !== null) rows.push({ asset, amount });
    });
  }

  return rows.sort((a, b) => b.amount - a.amount);
}

export function parseTicker(payload: unknown, pair: string): TickerSnapshot {
  const data = unwrap(payload);
  let entry: unknown = data;

  if (isRecord(data)) {
    const keys = Object.keys(data);
    const direct = keys.find((k) => k.toUpperCase().includes(pair.toUpperCase().replace("/", "")));
    const candidate = direct ?? keys.find((k) => isRecord(data[k]) && ("c" in (data[k] as object) || "last" in (data[k] as object)));
    if (candidate) entry = data[candidate];
  }

  if (!isRecord(entry)) return { pair, price: null, changePct: null, volume: null };

  const price = num(entry.c ?? entry.last ?? entry.price ?? entry.close ?? entry.lastPrice);
  const open = num(entry.o ?? entry.open ?? entry.open24h ?? entry.openPrice);
  const volumeRaw = entry.v ?? entry.volume ?? entry.vol ?? entry.volume24h;
  const volume = Array.isArray(volumeRaw)
    ? num(volumeRaw[1] ?? volumeRaw[0])
    : num(volumeRaw);

  let changePct = num(entry.changePct ?? entry.percentChange ?? entry.change24h);
  if (changePct === null && price !== null && open !== null && open !== 0) {
    changePct = ((price - open) / open) * 100;
  }

  return { pair, price, changePct, volume };
}

function toTradeRow(id: string, entry: Record<string, unknown>): TradeRow {
  const rawTime = entry.time ?? entry.opentm ?? entry.closetm ?? entry.timestamp ?? entry.createdAt;
  let time = num(rawTime);
  if (time !== null && time < 1e11) time *= 1000;
  if (time === null && typeof rawTime === "string") {
    const parsed = Date.parse(rawTime);
    time = Number.isNaN(parsed) ? null : parsed;
  }

  const descr = isRecord(entry.descr) ? entry.descr : {};

  return {
    id,
    time,
    pair: str(entry.pair ?? descr.pair ?? entry.symbol ?? entry.market) ?? "—",
    side: (str(entry.type ?? descr.type ?? entry.side ?? entry.direction) ?? "—").toLowerCase(),
    price: num(entry.price ?? entry.avg_price ?? descr.price ?? entry.cost),
    size: num(entry.vol ?? entry.volume ?? entry.size ?? entry.amount ?? entry.vol_exec),
    status: str(entry.status ?? entry.state ?? (entry.vol_exec !== undefined ? "executed" : null)) ?? "filled",
  };
}

export function parseTrades(payload: unknown): TradeRow[] {
  const data = unwrap(payload);
  const rows: TradeRow[] = [];

  const collect = (source: unknown) => {
    if (Array.isArray(source)) {
      source.forEach((entry, index) => {
        if (isRecord(entry)) {
          rows.push(toTradeRow(str(entry.id ?? entry.txid ?? entry.ordertxid) ?? String(index), entry));
        }
      });
      return;
    }
    if (isRecord(source)) {
      Object.entries(source).forEach(([id, entry]) => {
        if (isRecord(entry)) rows.push(toTradeRow(id, entry));
      });
    }
  };

  if (isRecord(data)) {
    const buckets = ["trades", "open", "closed", "orders", "history", "items"].filter(
      (key) => key in data,
    );
    if (buckets.length > 0) buckets.forEach((key) => collect(data[key]));
    else collect(data);
  } else {
    collect(data);
  }

  return rows.sort((a, b) => (b.time ?? 0) - (a.time ?? 0));
}