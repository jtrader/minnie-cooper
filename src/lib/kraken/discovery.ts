import type { McpTool } from "./types";
import type { SectionKey } from "./settings";

type Matcher = { include: string[]; exclude: string[] };

const MATCHERS: Record<SectionKey, Matcher> = {
  balances: {
    include: ["balance", "account_balance", "getbalance", "holdings", "portfolio"],
    exclude: ["trade_balance", "tradebalance"],
  },
  ticker: {
    include: ["ticker", "market_data", "price", "quote"],
    exclude: ["ohlc", "orderbook", "order_book", "depth", "spread"],
  },
  trades: {
    include: [
      "trades_history",
      "trade_history",
      "my_trades",
      "closed_orders",
      "open_orders",
      "orders",
      "trades",
    ],
    exclude: ["recent_trades", "public_trades", "add_order", "cancel"],
  },
};

const norm = (value: string) => value.toLowerCase().replace(/[\s-]+/g, "_");

function score(tool: McpTool, matcher: Matcher): number {
  const name = norm(tool.name ?? "");
  const description = norm(tool.description ?? "");
  if (matcher.exclude.some((term) => name.includes(term))) return 0;
  let value = 0;
  matcher.include.forEach((term, index) => {
    const weight = matcher.include.length - index;
    if (name.includes(term)) value += 10 * weight;
    else if (description.includes(term)) value += weight;
  });
  return value;
}

export type Guess = { tool: McpTool | null; confident: boolean };

export function guessTool(tools: McpTool[], section: SectionKey): Guess {
  const ranked = tools
    .map((tool) => ({ tool, value: score(tool, MATCHERS[section]) }))
    .filter((entry) => entry.value > 0)
    .sort((a, b) => b.value - a.value);

  if (ranked.length === 0) return { tool: null, confident: false };
  const best = ranked[0];
  const confident = best.value >= 10 && (ranked.length === 1 || best.value > ranked[1].value);
  return { tool: best.tool, confident };
}

/** Names of properties a tool accepts, if its input schema declares any. */
export function schemaProps(tool: McpTool | null | undefined): string[] {
  const schema = tool?.inputSchema as { properties?: Record<string, unknown> } | undefined;
  return schema?.properties ? Object.keys(schema.properties) : [];
}

/** Build arguments for a pair-taking tool by matching whatever key it declares. */
export function pairArgs(tool: McpTool | null | undefined, pair: string): Record<string, unknown> {
  const props = schemaProps(tool);
  const key =
    props.find((p) => /^(pair|pairs|symbol|symbols|ticker|market)$/i.test(p)) ??
    props.find((p) => /pair|symbol|market/i.test(p));
  if (!key) return {};
  const isArray =
    (
      (tool?.inputSchema as { properties?: Record<string, { type?: string }> })?.properties?.[
        key
      ] ?? {}
    ).type === "array";
  return { [key]: isArray ? [pair] : pair };
}