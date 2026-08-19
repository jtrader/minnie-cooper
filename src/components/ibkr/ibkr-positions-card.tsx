import { useQuery } from "@tanstack/react-query";
import { Layers, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIbkrConnection } from "@/components/ibkr/ibkr-connection";
import { IbkrErrorNotice } from "@/components/ibkr/ibkr-status-notice";
import { fetchPositions } from "@/lib/ibkr/gateway";
import { formatNumber, toneClass } from "@/lib/kraken/format";

export function IbkrPositionsCard() {
  const { baseUrl, authenticated, accountId } = useIbkrConnection();
  const enabled = authenticated && Boolean(accountId);

  const query = useQuery({
    queryKey: ["ibkr-positions", baseUrl, accountId],
    enabled,
    retry: false,
    refetchInterval: 30_000,
    queryFn: () => fetchPositions(baseUrl, accountId as string),
  });

  const rows = query.data ?? [];

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold tracking-tight">Positions</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label="Refresh IBKR positions"
          disabled={!enabled || query.isFetching}
          onClick={() => void query.refetch()}
        >
          {query.isFetching ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
        </Button>
      </header>

      <div className="p-3">
        {query.error ? (
          <IbkrErrorNotice error={query.error} />
        ) : !enabled ? (
          <p className="text-xs text-muted-foreground">Sign in to the gateway to load positions.</p>
        ) : query.isLoading ? (
          <p className="text-xs text-muted-foreground">Loading positions…</p>
        ) : rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">No open positions in this account.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="pb-1 font-medium">Contract</th>
                <th className="pb-1 text-right font-medium">Qty</th>
                <th className="pb-1 text-right font-medium">Avg</th>
                <th className="pb-1 text-right font-medium">Mkt</th>
                <th className="pb-1 text-right font-medium">Value</th>
                <th className="pb-1 text-right font-medium">Unrealised</th>
              </tr>
            </thead>
            <tbody className="font-mono tabular-nums">
              {rows.map((row) => (
                <tr key={`${row.conid}-${row.contractDesc}`} className="border-t border-border/60">
                  <td className="py-1 font-sans font-medium">{row.contractDesc}</td>
                  <td className="py-1 text-right">{formatNumber(row.position, 4)}</td>
                  <td className="py-1 text-right">{formatNumber(row.avgPrice, 4)}</td>
                  <td className="py-1 text-right">{formatNumber(row.marketPrice, 4)}</td>
                  <td className="py-1 text-right">{formatNumber(row.marketValue, 2)}</td>
                  <td className={`py-1 text-right ${toneClass(row.unrealizedPnl)}`}>
                    {formatNumber(row.unrealizedPnl, 2)}
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
