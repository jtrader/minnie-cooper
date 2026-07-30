import { useQuery } from "@tanstack/react-query";
import { History, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KrakenErrorNotice } from "./kraken-error-notice";
import { fetchKrakenActivity } from "@/lib/kraken/direct.functions";
import { formatNumber, formatTime } from "@/lib/kraken/format";

export function DirectActivityCard() {
  const query = useQuery({
    queryKey: ["kraken", "activity"],
    retry: false,
    queryFn: () => fetchKrakenActivity(),
  });

  const rows = query.data?.rows ?? [];
  const failure = query.data?.error;

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold tracking-tight">Open orders &amp; recent trades</h2>
          <code className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            OpenOrders + TradesHistory
          </code>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => query.refetch()}
          disabled={query.isFetching}
          aria-label="Refresh activity"
        >
          {query.isFetching ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
        </Button>
      </header>

      <div className="p-3">
        {query.isLoading ? (
          <p className="text-xs text-muted-foreground">Loading activity…</p>
        ) : failure ? (
          <KrakenErrorNotice kind={failure.kind} message={failure.message} />
        ) : rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">No open orders or trade history returned.</p>
        ) : (
          <div className="max-h-80 overflow-auto">
            <table className="w-full text-xs [&_td]:px-2 [&_th]:px-2">
              <thead className="sticky top-0 bg-card">
                <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="pb-1 font-medium">Time</th>
                  <th className="pb-1 font-medium">Pair</th>
                  <th className="pb-1 font-medium">Side</th>
                  <th className="pb-1 text-right font-medium">Price</th>
                  <th className="pb-1 text-right font-medium">Size</th>
                  <th className="pb-1 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-border/60">
                    <td className="py-1 whitespace-nowrap text-muted-foreground">
                      {formatTime(row.time)}
                    </td>
                    <td className="py-1 font-sans font-medium">{row.pair}</td>
                    <td
                      className={`py-1 uppercase ${row.side === "buy" ? "text-gain" : "text-loss"}`}
                    >
                      {row.side || "—"}
                    </td>
                    <td className="py-1 text-right">{formatNumber(row.price)}</td>
                    <td className="py-1 text-right">{formatNumber(row.size)}</td>
                    <td className="py-1 font-sans text-muted-foreground">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}