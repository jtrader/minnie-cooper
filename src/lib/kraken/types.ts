export type BridgeSettings = {
  baseUrl: string;
  token: string;
};

export type McpTool = {
  name: string;
  description?: string;
  inputSchema?: unknown;
};

export type CallToolResult = {
  content?: Array<{ type?: string; text?: string; [k: string]: unknown }>;
  isError?: boolean;
  structuredContent?: unknown;
  [k: string]: unknown;
};

export type BalanceRow = { asset: string; amount: number };

export type TickerSnapshot = {
  pair: string;
  price: number | null;
  changePct: number | null;
  volume: number | null;
};

export type TradeRow = {
  id: string;
  time: number | null;
  pair: string;
  side: string;
  price: number | null;
  size: number | null;
  status: string;
};

export class BridgeError extends Error {
  readonly kind: "unauthorized" | "network" | "http" | "tool";
  readonly status?: number;

  constructor(kind: BridgeError["kind"], message: string, status?: number) {
    super(message);
    this.name = "BridgeError";
    this.kind = kind;
    this.status = status;
  }
}