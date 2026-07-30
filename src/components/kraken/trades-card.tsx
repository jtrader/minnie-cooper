import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, History, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BridgeErrorNotice } from "./bridge-error-notice";
import { ToolPicker } from "./tool-picker";
import { callTool, extractPayload } from "@/lib/kraken/client";
import { parseTrades } from "@/lib/kraken/parse";
import { formatNumber, formatTime } from "@/lib/kraken/format";
import type { BridgeSettings, McpTool, TradeRow } from "@/lib/kraken/types";

type SortKey = keyof Pick<TradeRow, "time" | "pair" | "side" | "price" | "size" | "status">;

const COLUMNS: Array<{ key: SortKey; label: string; numeric?: boolean }> = [
  { key: "time", label: "Time" },
  { key: "pair", label: "Pair" },
  { key: "side", label: "Side" },
  { key: "price", label: "Price", numeric: true },
  { key: "size", label: "Size", numeric: true },
  { key: "status", label: "Status" },
];

type TradesCardProps = {
  settings: BridgeSettings;
  tools: McpTool[];
  toolName?: string;
  onSelectTool: (name: string) => void;
  needsPicker: boolean;
};

export function TradesCard({
  settings,
  tools,
  toolName,
  onSelectTool,
  needsPicker,
}: TradesCardProps) {
  const [sortKey, setSortKey] = useState<SortKey>("time");
  const [asc, setAsc] = useState(false);

  const query = useQuery({
    queryKey: ["trades", settings.baseUrl, toolName],
    enabled: Boolean(toolName),
    retry: false,
    queryFn: async () => extractPayload(await callTool(settings, toolName as string)),
  });

  const rows = useMemo(() => {
    const parsed = parseTrades(query.data);
    const sorted = [...parsed].sort((a, b) => {
      const left = a[sortKey];
      const right = b[sortKey];
      if (typeof left === "number" || typeof right === "number") {
        return (Number(left ?? 0) - Number(right ?? 0)) * (asc ? 1 : -1);
      }
      return String(left ?? "").localeCompare(String(right ?? "")) * (asc ? 1 : -1);
    });
    return sorted;
  }, [query.data, sortKey, asc]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setAsc((value) => !value);
    else {
      setSortKey(key);
      setAsc(false);
    }
  };

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold tracking-tight">Recent trades &amp; orders</h2>
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
            aria-label="Refresh trades"
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
            No trades/orders tool identified. Pick the tool that returns your trade or order
            history.
          </p>
        ) : query.error ? (
          <BridgeErrorNotice error={query.error} />
        ) : query.isLoading ? (
          <p className="text-xs text-muted-foreground">Loading activity…</p>
        ) : rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">No trades or orders returned.</p>
        ) : (
          <div className="max-h-80 overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card">
                <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  {COLUMNS.map((column) => (
                    <th key={column.key} className={column.numeric ? "text-right" : ""}>
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className="inline-flex items-center gap-1 py-1 font-medium hover:text-foreground"
                      >
                        {column.label}
                        {sortKey === column.key ? (
                          asc ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : null}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-border/60">
                    <td className="py-1 whitespace-nowrap text-muted-foreground">
                      {formatTime(row.time)}
                    </td>
                    <td className="py-1">{row.pair}</td>
                    <td
                      className={`py-1 uppercase ${
                        row.side.startsWith("b") ? "text-gain" : row.side.startsWith("s") ? "text-loss" : ""
                      }`}
                    >
                      {row.side}
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