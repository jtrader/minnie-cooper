import { Mt5BalancesCard } from "@/components/mt5/mt5-balances-card";
import { Mt5PositionsCard } from "@/components/mt5/mt5-positions-card";
import { Mt5OrdersCard } from "@/components/mt5/mt5-orders-card";
import { Mt5AccountButton } from "@/components/mt5/mt5-account-button";
import { useMt5Connection } from "@/components/mt5/mt5-connection";

export function Mt5Panel() {
  const { connected, openConnectModal, status } = useMt5Connection();
  return <div className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2"><div><p className="text-sm font-semibold">MetaTrader 5</p><p className="font-mono text-[11px] text-muted-foreground">{connected ? `${status?.brokerServer ?? "broker"} · ${status?.connectionStatus ?? "connected"}` : "Cloud-connected MT5 account"}</p></div><Mt5AccountButton /></div>{connected ? <><div className="grid gap-3 lg:grid-cols-2"><Mt5BalancesCard /><Mt5PositionsCard /></div><Mt5OrdersCard /></> : <div className="rounded-lg border border-border bg-card p-5 text-center"><p className="text-sm font-medium">No MetaTrader 5 account connected</p><p className="mt-1 text-xs text-muted-foreground">Connect your broker/server, account number and password. The connection is server-side through MetaApi Cloud, so it works for every signed-in user.</p><button type="button" onClick={openConnectModal} className="mt-3 rounded-md border border-input px-3 py-1.5 text-xs font-medium hover:bg-accent">Connect MetaTrader 5</button></div>}</div>;
}
