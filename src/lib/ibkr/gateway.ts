import {
  IbkrError,
  type IbkrAccount,
  type IbkrAuthStatus,
  type IbkrContract,
  type IbkrLedgerRow,
  type IbkrOrder,
  type IbkrOrderDraft,
  type IbkrPlaceResult,
  type IbkrPnlRow,
  type IbkrPosition,
  type IbkrTrade,
} from "./types";

export const DEFAULT_GATEWAY_URL = "https://localhost:5000/v1/api";

export function normaliseBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

/** Origin of the gateway, used for the "open the gateway" button. */
export function gatewayOrigin(baseUrl: string): string {
  try {
    return new URL(normaliseBaseUrl(baseUrl)).origin;
  } catch {
    return normaliseBaseUrl(baseUrl);
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.replace(/[, ]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function str(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

/**
 * All gateway calls happen from the browser: the Client Portal Gateway runs on the
 * user's own machine and holds the session cookie, so the deployed server can never
 * reach it. `credentials: "include"` carries that cookie.
 */
export async function gatewayFetch<T = unknown>(
  baseUrl: string,
  path: string,
  init?: { method?: "GET" | "POST" | "DELETE"; body?: unknown },
): Promise<T> {
  const base = normaliseBaseUrl(baseUrl);
  if (!base) throw new IbkrError("unreachable", "No gateway base URL configured.");

  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      method: init?.method ?? "GET",
      credentials: "include",
      headers: init?.body ? { "Content-Type": "application/json" } : undefined,
      body: init?.body ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new IbkrError(
      "unreachable",
      "Could not reach the Client Portal Gateway. Check it is running, that you have accepted its self-signed certificate in this browser, and that CORS is allowed for this origin.",
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new IbkrError("auth", "IBKR Gateway session is not authenticated.", response.status);
  }

  const text = await response.text();
  if (!response.ok) {
    throw new IbkrError("http", `Gateway returned ${response.status}: ${text.slice(0, 300)}`, response.status);
  }

  if (!text) return null as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new IbkrError("parse", "Gateway returned a response that was not valid JSON.");
  }
}

export async function fetchAuthStatus(baseUrl: string): Promise<IbkrAuthStatus> {
  const raw = asRecord(await gatewayFetch(baseUrl, "/iserver/auth/status", { method: "POST" }));
  return {
    authenticated: raw['authenticated'] === true,
    connected: raw['connected'] === true,
    competing: raw['competing'] === true,
    message: typeof raw['message'] === "string" ? raw['message'] : null,
  };
}

export async function tickle(baseUrl: string): Promise<void> {
  await gatewayFetch(baseUrl, "/tickle", { method: "POST" });
}

export async function fetchAccounts(baseUrl: string): Promise<IbkrAccount[]> {
  const raw = asRecord(await gatewayFetch(baseUrl, "/iserver/accounts"));
  const ids = Array.isArray(raw['accounts']) ? (raw['accounts'] as unknown[]) : [];
  const info = asRecord(raw['aliases']);
  return ids.map((id) => {
    const accountId = str(id);
    return {
      id: accountId,
      accountId,
      displayName: str(info[accountId], accountId) || accountId,
      type: null,
    };
  });
}

export async function fetchLedger(baseUrl: string, accountId: string): Promise<IbkrLedgerRow[]> {
  const raw = asRecord(await gatewayFetch(baseUrl, `/portfolio/${accountId}/ledger`));
  return Object.entries(raw)
    .filter(([currency]) => currency !== "BASE" || Object.keys(raw).length === 1)
    .map(([currency, value]) => {
      const row = asRecord(value);
      return {
        currency,
        cashBalance: num(row['cashbalance']),
        netLiquidation: num(row['netliquidationvalue']),
        unrealizedPnl: num(row['unrealizedpnl']),
        realizedPnl: num(row['realizedpnl']),
      };
    })
    .filter((row) => row.cashBalance !== null || row.netLiquidation !== null);
}

export async function fetchPnl(baseUrl: string): Promise<IbkrPnlRow[]> {
  const raw = asRecord(await gatewayFetch(baseUrl, "/iserver/account/pnl/partitioned"));
  const upnl = asRecord(raw['upnl']);
  return Object.entries(upnl).map(([key, value]) => {
    const row = asRecord(value);
    return {
      key,
      dailyPnl: num(row['dpl']),
      unrealizedPnl: num(row['upl']),
      realizedPnl: num(row['rpl']),
      netLiquidation: num(row['nl']),
    };
  });
}

export async function fetchPositions(baseUrl: string, accountId: string): Promise<IbkrPosition[]> {
  const raw = await gatewayFetch(baseUrl, `/portfolio/${accountId}/positions/0`);
  const list = Array.isArray(raw) ? raw : [];
  return list.map((entry) => {
    const row = asRecord(entry);
    return {
      conid: num(row['conid']),
      contractDesc: str(row['contractDesc'], str(row['ticker'], "—")),
      position: num(row['position']),
      avgPrice: num(row['avgCost']),
      marketPrice: num(row['mktPrice']),
      marketValue: num(row['mktValue']),
      unrealizedPnl: num(row['unrealizedPnl']),
      currency: str(row['currency'], ""),
    };
  });
}

export async function fetchOrders(baseUrl: string): Promise<IbkrOrder[]> {
  const raw = asRecord(await gatewayFetch(baseUrl, "/iserver/account/orders"));
  const list = Array.isArray(raw['orders']) ? (raw['orders'] as unknown[]) : [];
  return list.map((entry) => {
    const row = asRecord(entry);
    return {
      orderId: str(row['orderId'], str(row['order_ref'], crypto.randomUUID())),
      ticker: str(row['ticker'], str(row['symbol'], "—")),
      side: str(row['side'], "—"),
      orderType: str(row['orderType'], "—"),
      quantity: num(row['totalSize']) ?? num(row['remainingQuantity']),
      filled: num(row['filledQuantity']),
      price: num(row['price']) ?? num(row['avgPrice']),
      status: str(row['status'], "—"),
      lastExecTime: num(row['lastExecutionTime_r']),
    };
  });
}

export async function fetchTrades(baseUrl: string): Promise<IbkrTrade[]> {
  const raw = await gatewayFetch(baseUrl, "/iserver/account/trades");
  const list = Array.isArray(raw) ? raw : [];
  return list.map((entry) => {
    const row = asRecord(entry);
    const time = num(row['trade_time_r']);
    return {
      executionId: str(row['execution_id'], crypto.randomUUID()),
      time,
      symbol: str(row['symbol'], str(row['contract_description_1'], "—")),
      side: str(row['side'], "—"),
      price: num(row['price']),
      size: num(row['size']),
      status: str(row['order_description'], str(row['status'], "Filled")),
    };
  });
}

export async function searchContracts(baseUrl: string, symbol: string): Promise<IbkrContract[]> {
  const raw = await gatewayFetch(baseUrl, "/iserver/secdef/search", {
    method: "POST",
    body: { symbol, name: false },
  });
  const list = Array.isArray(raw) ? raw : [];
  return list.slice(0, 12).map((entry) => {
    const row = asRecord(entry);
    return {
      conid: str(row['conid']),
      symbol: str(row['symbol'], "—"),
      description: str(row['description'], ""),
      companyName: str(row['companyHeader'], str(row['companyName'], "")),
      secType: str(asRecord(Array.isArray(row['sections']) ? (row['sections'] as unknown[])[0] : {})['secType'], "STK"),
    };
  });
}

function readReply(payload: unknown): IbkrPlaceResult | null {
  const list = Array.isArray(payload) ? payload : [payload];
  const first = asRecord(list[0]);
  if (typeof first['id'] === "string" && Array.isArray(first['message'])) {
    return {
      kind: "reply",
      reply: { id: first['id'], messages: (first['message'] as unknown[]).map((m) => str(m)) },
    };
  }
  if (first['order_id'] !== undefined || first['order_status'] !== undefined) {
    return {
      kind: "placed",
      orderId: first['order_id'] !== undefined ? str(first['order_id']) : null,
      status: first['order_status'] !== undefined ? str(first['order_status']) : null,
    };
  }
  return null;
}

export async function placeOrder(
  baseUrl: string,
  accountId: string,
  draft: IbkrOrderDraft,
): Promise<IbkrPlaceResult> {
  const payload = await gatewayFetch(baseUrl, `/iserver/account/${accountId}/orders`, {
    method: "POST",
    body: {
      orders: [
        {
          conid: Number(draft.conid),
          orderType: draft.orderType,
          side: draft.side,
          quantity: draft.quantity,
          tif: draft.tif,
          ...(draft.orderType === "LMT" && draft.limitPrice !== null ? { price: draft.limitPrice } : {}),
        },
      ],
    },
  });
  const result = readReply(payload);
  if (!result) throw new IbkrError("parse", "Unexpected response from IBKR when placing the order.");
  return result;
}

export async function confirmReply(baseUrl: string, replyId: string): Promise<IbkrPlaceResult> {
  const payload = await gatewayFetch(baseUrl, `/iserver/reply/${replyId}`, {
    method: "POST",
    body: { confirmed: true },
  });
  const result = readReply(payload);
  if (!result) throw new IbkrError("parse", "Unexpected response from IBKR when confirming the order.");
  return result;
}
