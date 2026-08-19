import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, History, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIbkrConnection } from "@/components/ibkr/ibkr-connection";
import { IbkrErrorNotice } from "@/components/ibkr/ibkr-status-notice";
import { fetchOrders, fetchTrades } from "@/lib/ibkr/gateway";
import { formatNumber, formatTime } from "@/lib/kraken/format";
import type { IbkrOrder, IbkrTrade } from "@/lib/ibkr/types";

type Column<T> = { key: keyof T; label: string; render: (row: T) => string; numeric?: boolean };

const ORDER_COLUMNS: Array<Column<IbkrOrder>> = [
  { key: "lastExecTime", label: "Time", render: (r) => formatTime(r.lastExecTime) },
  { key: "ticker", label: "Symbol", render: (r) => r.ticker },
  { key: "side", label: "Side", render: (r) => r.side },
  { key: "orderType", label: "Type", render: (r) => r.orderType },
  { key: "quantity", label: "Qty", render: (r) => formatNumber(r.quantity, 4), numeric: true },
  { key: "filled", label: "Filled", render: (r) => formatNumber(r.filled, 4), numeric: true },
  { key: "price", label: "Price", render: (r) => formatNumber(r.price, 4), numeric: true },
  { key: "status", label: "Status", render: (r) => r.status },
];

const TRADE_COLUMNS: Array<Column<IbkrTrade>> = [
  { key: "time", label: "Time", render: (r) => formatTime(r.time) },
  { key: "symbol", label: "Symbol", render: (r) => r.symbol },
  { key: "side", label: "Side", render: (r) => r.side },
  { key: "price", label: "Price", render: (r) => formatNumber(r.price, 4), numeric: true },
  { key: "size", label: "Size", render: (r) => formatNumber(r.size, 4), numeric: true },
  { key: "status", label: "Detail", render: (r) => r.status },
];

function sortRows<T extends Record<string, unknown>>(rows: T[], key: keyof T, asc: boolean): T[] {
  return [...rows].sort((a, b) => {
    const left = a[key];
    const right = b[key];
    if (typeof left === "number" || typeof right === "number") {
      return (Number(left ?? 0) - Number(right ?? 0)) * (asc ? 1 : -1);
    }
    return String(left ?? "").localeCompare(String(right ?? "")) * (asc ? 1 : -1);
  });
}

function DataTable<T extends Record<string, unknown>>({
  rows,
  columns,
  rowKey,
  sortKey,
  asc,
  onSort,
}: {
  rows: T[];
  columns: Array<Column<T>>;
  rowKey: (row: T) => string;
  sortKey: keyof T;
  asc: boolean;
  onSort: (key: keyof T) => void;
}) {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
          {columns.map((column) => (
            <th key={String(column.key)} className={`pb-1 font-medium ${column.numeric ? "text-right" : ""}`}>
              <button
                type="button"
                className="inline-flex items-center gap-1 hover:text-foreground"
                onClick={() => onSort(column.key)}
              >
                {column.label}
                {sortKey === column.key ? (
                  asc ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                ) : null}
              </button>
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="font-mono tabular-nums">
        {rows.map((row) => (
          <tr key={rowKey(row)} className="border-t border-border/60">
            {columns.map((column) => (
              <td
                key={String(column.key)}
                className={`py-1 ${column.numeric ? "text-right" : "font-sans"}`}
              >
                {column.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function IbkrOrdersCard() {
  const { baseUrl, authenticated } = useIbkrConnection();
  const [orderSort, setOrderSort] = useState<{ key: keyof IbkrOrder; asc: boolean }>({
    key: "lastExecTime",
    asc: false,
  });
  const [tradeSort, setTradeSort] = useState<{ key: keyof IbkrTrade; asc: boolean }>({
    key: "time",
    asc: false,
  });

  const ordersQuery = useQuery({
    queryKey: ["ibkr-orders", baseUrl],
    enabled: authenticated,
    retry: false,
    refetchInterval: 15_000,
    queryFn: () => fetchOrders(baseUrl),
  });

  const tradesQuery = useQuery({
    queryKey: ["ibkr-trades", baseUrl],
    enabled: authenticated,
    retry: false,
    refetchInterval: 30_000,
    queryFn: () => fetchTrades(baseUrl),
  });

  const orders = useMemo(
    () => sortRows(ordersQuery.data ?? [], orderSort.key, orderSort.asc),
    [ordersQuery.data, orderSort],
  );
  const trades = useMemo(
    () => sortRows(tradesQuery.data ?? [], tradeSort.key, tradeSort.asc),
    [tradesQuery.data, tradeSort],
  );

  const busy = ordersQuery.isFetching || tradesQuery.isFetching;

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold tracking-tight">Orders &amp; executions</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label="Refresh IBKR orders"
          disabled={!authenticated || busy}
          onClick={() => {
            void ordersQuery.refetch();
            void tradesQuery.refetch();
          }}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        </Button>
      </header>

      <div className="p-3">
        {!authenticated ? (
          <p className="text-xs text-muted-foreground">Sign in to the gateway to load orders.</p>
        ) : (
          <Tabs defaultValue="orders">
            <TabsList className="h-8">
              <TabsTrigger value="orders" className="text-xs">Live orders</TabsTrigger>
              <TabsTrigger value="trades" className="text-xs">Executions</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="mt-3">
              {ordersQuery.error ? (
                <IbkrErrorNotice error={ordersQuery.error} />
              ) : ordersQuery.isLoading ? (
                <p className="text-xs text-muted-foreground">Loading orders…</p>
              ) : orders.length === 0 ? (
                <p className="text-xs text-muted-foreground">No live or working orders.</p>
              ) : (
                <DataTable
                  rows={orders}
                  columns={ORDER_COLUMNS}
                  rowKey={(row) => row.orderId}
                  sortKey={orderSort.key}
                  asc={orderSort.asc}
                  onSort={(key) =>
                    setOrderSort((prev) => ({ key, asc: prev.key === key ? !prev.asc : false }))
                  }
                />
              )}
            </TabsContent>

            <TabsContent value="trades" className="mt-3">
              {tradesQuery.error ? (
                <IbkrErrorNotice error={tradesQuery.error} />
              ) : tradesQuery.isLoading ? (
                <p className="text-xs text-muted-foreground">Loading executions…</p>
              ) : trades.length === 0 ? (
                <p className="text-xs text-muted-foreground">No executions reported today.</p>
              ) : (
                <DataTable
                  rows={trades}
                  columns={TRADE_COLUMNS}
                  rowKey={(row) => row.executionId}
                  sortKey={tradeSort.key}
                  asc={tradeSort.asc}
                  onSort={(key) =>
                    setTradeSort((prev) => ({ key, asc: prev.key === key ? !prev.asc : false }))
                  }
                />
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </section>
  );
}
