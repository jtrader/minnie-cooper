import { useQuery } from "@tanstack/react-query";
import { Layers, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { mt5Request } from "@/lib/mt5/credentials.functions";
import { formatNumber, toneClass } from "@/lib/kraken/format";
import { useMt5Connection } from "@/components/mt5/mt5-connection";

export function Mt5PositionsCard() {
  const { connected } = useMt5Connection(); const request = useServerFn(mt5Request);
  const query = useQuery({ queryKey: ["mt5-positions"], enabled: connected, refetchInterval: 30_000, retry: false, queryFn: () => request({ data: { resource: "positions" } }) });
  const rows = query.data?.positions ?? [];
  return <section className="rounded-lg border border-border bg-card"><header className="flex items-center justify-between border-b border-border px-3 py-2"><div className="flex items-center gap-2"><Layers className="h-4 w-4 text-muted-foreground" /><h3 className="text-sm font-semibold">Positions</h3></div><Button variant="ghost" size="icon" className="h-7 w-7" disabled={!connected || query.isFetching} onClick={() => void query.refetch()}>{query.isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}</Button></header><div className="overflow-x-auto p-3">{!connected ? <p className="text-xs text-muted-foreground">Connect MetaTrader 5 to load positions.</p> : query.isLoading ? <p className="text-xs text-muted-foreground">Loading positions…</p> : rows.length === 0 ? <p className="text-xs text-muted-foreground">No open positions.</p> : <table className="w-full text-xs"><thead><tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground"><th className="pb-1">Symbol</th><th className="pb-1">Side</th><th className="pb-1 text-right">Volume</th><th className="pb-1 text-right">Open</th><th className="pb-1 text-right">Market</th><th className="pb-1 text-right">P&amp;L</th></tr></thead><tbody className="font-mono tabular-nums">{rows.map(r => <tr key={r.id} className="border-t border-border/60"><td className="py-1 font-sans font-medium">{r.symbol}</td><td className="py-1 font-sans">{r.type}</td><td className="py-1 text-right">{formatNumber(r.volume,4)}</td><td className="py-1 text-right">{formatNumber(r.openPrice,5)}</td><td className="py-1 text-right">{formatNumber(r.currentPrice,5)}</td><td className={`py-1 text-right ${toneClass(r.profit)}`}>{formatNumber(r.profit,2)}</td></tr>)}</tbody></table>}{query.error ? <p className="mt-2 text-xs text-destructive">{query.error instanceof Error ? query.error.message : "Could not load positions."}</p> : null}</div></section>;
}
