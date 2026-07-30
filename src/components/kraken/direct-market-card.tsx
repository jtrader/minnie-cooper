import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Loader2, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KrakenErrorNotice } from "./kraken-error-notice";
import { fetchKrakenTicker } from "@/lib/kraken/direct.functions";
import { formatNumber, formatPct, toneClass } from "@/lib/kraken/format";

const DEFAULT_PAIRS = "XBTUSD,ETHUSD,SOLUSD";

export function DirectMarketCard() {
  const [pairs, setPairs] = useState(DEFAULT_PAIRS);
  const [draft, setDraft] = useState(DEFAULT_PAIRS);
  const [live, setLive] = useState(true);

  const query = useQuery({
    queryKey: ["kraken", "ticker", pairs],
    retry: false,
    refetchInterval: live ? 10_000 : false,
    queryFn: () => fetchKrakenTicker({ data: { pairs } }),
  });

  const rows = query.data?.rows ?? [];
  const failure = query.data?.error;

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold tracking-tight">Market data</h2>
          {query.isFetching ? <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" /> : null}
        </div>
        <div className="flex items-center gap-1.5">
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => setPairs(draft.trim() || DEFAULT_PAIRS)}
            onKeyDown={(event) => {
              if (event.key === "Enter") setPairs(draft.trim() || DEFAULT_PAIRS);
            }}
            className="h-7 w-48 font-mono text-[11px]"
            aria-label="Trading pairs"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setLive((value) => !value)}
            aria-label={live ? "Pause auto refresh" : "Resume auto refresh"}
          >
            {live ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </header>

      <div className="p-3">
        {query.isLoading ? (
          <p className="text-xs text-muted-foreground">Loading prices…</p>
        ) : failure ? (
          <KrakenErrorNotice kind={failure.kind} message={failure.message} />
        ) : rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">No pairs matched. Try e.g. XBTUSD,ETHUSD.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="pb-1 font-medium">Pair</th>
                <th className="pb-1 text-right font-medium">Last</th>
                <th className="pb-1 text-right font-medium">24h</th>
                <th className="pb-1 text-right font-medium">Volume</th>
              </tr>
            </thead>
            <tbody className="font-mono tabular-nums">
              {rows.map((row) => (
                <tr key={row.pair} className="border-t border-border/60">
                  <td className="py-1 font-sans font-medium">{row.pair}</td>
                  <td className="py-1 text-right">{formatNumber(row.price)}</td>
                  <td className={`py-1 text-right ${toneClass(row.changePct)}`}>
                    {formatPct(row.changePct)}
                  </td>
                  <td className="py-1 text-right text-muted-foreground">
                    {formatNumber(row.volume)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}