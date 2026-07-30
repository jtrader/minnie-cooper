export const WATCHLIST = [
  {
    category: "Core",
    tag: "core",
    items: [
      "BTC/USD",
      "ETH/USD",
      "SOL/USD",
      "XRP/USD",
      "TRX/USD",
      "XMR/USD",
      "ADA/USD",
      "SUI/USD",
      "HYPE/USD",
      "TAO/USD",
      "DOGE/USD",
    ],
  },
  { category: "Independent", tag: "indi", items: ["PAXG/USD", "EUR/USD", "AUD/USD"] },
  { category: "Relative", tag: "rel", items: ["ETH/BTC", "SOL/ETH", "LINK/BTC", "AAVE/ETH"] },
  { category: "Confirmation", tag: "conf", items: ["TRX/BTC", "BTC/EUR", "ETH/EUR", "SOL/EUR"] },
] as const;

export type WatchlistGroup = (typeof WATCHLIST)[number];
export type WatchlistSymbol = WatchlistGroup["items"][number];

/** Kraken uses XBT for bitcoin; display symbols use BTC. */
const ASSET_ALIASES: Record<string, string> = { BTC: "XBT" };

export function toKrakenPair(symbol: string): string {
  return symbol
    .split("/")
    .map((asset) => ASSET_ALIASES[asset.toUpperCase()] ?? asset.toUpperCase())
    .join("");
}

export const FLAT_WATCHLIST: { symbol: string; pair: string; tag: string }[] = WATCHLIST.flatMap(
  (group) => group.items.map((symbol) => ({ symbol, pair: toKrakenPair(symbol), tag: group.tag })),
);
