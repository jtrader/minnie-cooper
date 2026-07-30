import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KrakenErrorNotice } from "./kraken-error-notice";
import { fetchKrakenBalances } from "@/lib/kraken/direct.functions";
import { formatNumber } from "@/lib/kraken/format";

export function DirectBalancesCard() {
  const query = useQuery({
    queryKey: ["kraken", "balances"],
    retry: false,
    queryFn: () => fetchKrakenBalances(),
  });

  const rows = query.data?.rows ?? [];
  const failure = query.data?.error;

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold tracking-tight">Account balances</h2>
          <code className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            private/Balance
          </code>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => query.refetch()}
          disabled={query.isFetching}
          aria-label="Refresh balances"
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
          <p className="text-xs text-muted-foreground">Loading balances…</p>
        ) : failure ? (
          <KrakenErrorNotice kind={failure.kind} message={failure.message} />
        ) : rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">No non-zero balances on this account.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="pb-1 font-medium">Asset</th>
                <th className="pb-1 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="font-mono tabular-nums">
              {rows.map((row) => (
                <tr key={row.asset} className="border-t border-border/60">
                  <td className="py-1 font-sans font-medium">{row.asset}</td>
                  <td className="py-1 text-right">{formatNumber(row.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}