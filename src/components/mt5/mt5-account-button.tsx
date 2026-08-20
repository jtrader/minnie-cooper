import { Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMt5Connection } from "@/components/mt5/mt5-connection";

export function Mt5AccountButton() {
  const { status, connected, openConnectModal } = useMt5Connection();
  return <Button variant="outline" size="sm" onClick={openConnectModal}><Network className={`h-3.5 w-3.5 ${connected ? "text-primary" : "text-muted-foreground"}`} /><span className="font-mono text-[11px]">{connected ? `MT5 ${status?.loginMasked ?? "connected"}` : "Connect MT5"}</span></Button>;
}
