import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIbkrConnection } from "@/components/ibkr/ibkr-connection";
import { IbkrErrorNotice } from "@/components/ibkr/ibkr-status-notice";
import { fetchLedger, fetchPnl } from "@/lib/ibkr/gateway";
import { formatNumber } from "@/lib/kraken/format";
import { toneClass } from "@/lib/kraken/format";

export function IbkrBalancesCard() {
  const { baseUrl, authenticated, accountId, accounts, setAccountId } = useIbkrConnection();
  const enabled = authenticated && Boolean(accountId);

  const ledgerQuery = useQuery({
    queryKey: ["ibkr-ledger", baseUrl, accountId],
    enabled,
    retry: false,
    refetchInterval: 30_000,
    queryFn: () => fetchLedger(baseUrl, accountId as string),
  });

  const pnlQuery = useQuery({
    queryKey: ["ibkr-pnl", baseUrl],
    enabled,
    retry: false,
    refetchInterval: 30_000,
    queryFn: () => fetchPnl(baseUrl),
  });

  const rows = ledgerQuery.data ?? [];
  const pnl = pnlQuery.data ?? [];

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold tracking-tight">Accounts &amp; balances</h3>
        </div>
        <div className="flex items-center gap-2">
          {accounts.length > 0 ? (
            <Select value={accountId ?? undefined} onValueChange={setAccountId}>
              <SelectTrigger className="h-7 w-[160px] font-mono text-[11px]">
                <SelectValue placeholder="Account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.accountId} value={account.accountId} className="font-mono text-xs">
                    {account.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Refresh IBKR balances"
            disabled={!enabled || ledgerQuery.isFetching}
            onClick={() => {
              void ledgerQuery.refetch();
              void pnlQuery.refetch();
            }}
          >
            {ledgerQuery.isFetching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </header>

      <div className="space-y-3 p-3">
        {ledgerQuery.error ? <IbkrErrorNotice error={ledgerQuery.error} /> : null}
        {!enabled ? (
          <p className="text-xs text-muted-foreground">Sign in to the gateway to load balances.</p>
        ) : ledgerQuery.isLoading ? (
          <p className="text-xs text-muted-foreground">Loading balances…</p>
        ) : rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">No cash balances returned for this account.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="pb-1 font-medium">Currency</th>
                <th className="pb-1 text-right font-medium">Cash</th>
                <th className="pb-1 text-right font-medium">Net liq.</th>
                <th className="pb-1 text-right font-medium">Unrealised</th>
              </tr>
            </thead>
            <tbody className="font-mono tabular-nums">
              {rows.map((row) => (
                <tr key={row.currency} className="border-t border-border/60">
                  <td className="py-1 font-sans font-medium">{row.currency}</td>
                  <td className="py-1 text-right">{formatNumber(row.cashBalance, 2)}</td>
                  <td className="py-1 text-right">{formatNumber(row.netLiquidation, 2)}</td>
                  <td className={`py-1 text-right ${toneClass(row.unrealizedPnl)}`}>
                    {formatNumber(row.unrealizedPnl, 2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {pnl.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-3">
            {pnl.slice(0, 3).map((row) => (
              <div key={row.key} className="rounded-md border border-border bg-muted/20 px-2.5 py-2">
                <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  {row.key}
                </p>
                <p className={`font-mono text-sm tabular-nums ${toneClass(row.dailyPnl)}`}>
                  {formatNumber(row.dailyPnl, 2)}
                </p>
                <p className="text-[10px] text-muted-foreground">Daily P&amp;L</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
