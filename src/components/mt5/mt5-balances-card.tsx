import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { mt5Request } from "@/lib/mt5/credentials.functions";
import { formatNumber, toneClass } from "@/lib/kraken/format";
import { useMt5Connection } from "@/components/mt5/mt5-connection";

export function Mt5BalancesCard() {
  const { connected } = useMt5Connection();
  const request = useServerFn(mt5Request);
  const query = useQuery({
    queryKey: ["mt5-summary"],
    enabled: connected,
    refetchInterval: 30_000,
    retry: false,
    queryFn: () => request({ data: { resource: "summary" } }),
  });
  const s = query.data?.summary;

  const cells: { label: string; value: string; tone?: string }[] = [
    { label: "Balance", value: formatNumber(s?.balance ?? null, 2) },
    { label: "Equity", value: formatNumber(s?.equity ?? null, 2) },
    { label: "Margin", value: formatNumber(s?.margin ?? null, 2) },
    { label: "Free margin", value: formatNumber(s?.freeMargin ?? null, 2) },
    {
      label: "Margin level",
      value: s?.marginLevel == null ? "—" : `${formatNumber(s.marginLevel, 2)}%`,
      tone: toneClass(s?.marginLevel == null ? null : s.marginLevel - 100),
    },
    { label: "Currency", value: s?.currency ?? "—" },
  ];

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Account summary</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={!connected || query.isFetching}
          onClick={() => void query.refetch()}
        >
          {query.isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        </Button>
      </header>
      {!connected ? (
        <p className="p-3 text-xs text-muted-foreground">Connect MetaTrader 5 to load your account summary.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
          {cells.map((cell) => (
            <div key={cell.label} className="rounded-md border border-border bg-muted/20 px-2.5 py-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{cell.label}</p>
              <p className={`font-mono text-sm tabular-nums ${cell.tone ?? ""}`}>{cell.value}</p>
            </div>
          ))}
        </div>
      )}
      {query.error ? (
        <p className="px-3 pb-3 text-xs text-destructive">
          {query.error instanceof Error ? query.error.message : "Could not load MT5 account summary."}
        </p>
      ) : null}
      {s?.server || s?.leverage != null ? (
        <div className="flex gap-4 px-3 pb-3 font-mono text-[11px] text-muted-foreground">
          {s?.server ? <span>{s.server}</span> : null}
          {s?.leverage != null ? <span>1:{formatNumber(s.leverage, 0)}</span> : null}
        </div>
      ) : null}
    </section>
  );
}
