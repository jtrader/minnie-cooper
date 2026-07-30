import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BridgeErrorNotice } from "./bridge-error-notice";
import { ToolPicker } from "./tool-picker";
import { callTool, extractPayload } from "@/lib/kraken/client";
import { parseBalances } from "@/lib/kraken/parse";
import { formatNumber } from "@/lib/kraken/format";
import type { BridgeSettings, McpTool } from "@/lib/kraken/types";

type BalancesCardProps = {
  settings: BridgeSettings;
  tools: McpTool[];
  toolName?: string;
  onSelectTool: (name: string) => void;
  needsPicker: boolean;
};

export function BalancesCard({
  settings,
  tools,
  toolName,
  onSelectTool,
  needsPicker,
}: BalancesCardProps) {
  const query = useQuery({
    queryKey: ["balances", settings.baseUrl, toolName],
    enabled: Boolean(toolName),
    queryFn: async () => extractPayload(await callTool(settings, toolName as string)),
  });

  const rows = parseBalances(query.data);

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold tracking-tight">Account balances</h2>
          {toolName ? (
            <code className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {toolName}
            </code>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {needsPicker || !toolName ? (
            <ToolPicker tools={tools} value={toolName} onChange={onSelectTool} />
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => query.refetch()}
            disabled={!toolName || query.isFetching}
            aria-label="Refresh balances"
          >
            {query.isFetching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </header>

      <div className="p-3">
        {!toolName ? (
          <p className="text-xs text-muted-foreground">
            No balance tool identified. Pick the tool that returns account balances.
          </p>
        ) : query.error ? (
          <BridgeErrorNotice error={query.error} />
        ) : query.isLoading ? (
          <p className="text-xs text-muted-foreground">Loading balances…</p>
        ) : rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            The tool returned no recognisable balances. Try another tool or inspect it in the Tool
            Explorer.
          </p>
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