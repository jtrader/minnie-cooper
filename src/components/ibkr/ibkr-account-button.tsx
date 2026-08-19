import { Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIbkrConnection } from "@/components/ibkr/ibkr-connection";

export function IbkrAccountButton() {
  const { configured, authenticated, accountId, openConnectModal } = useIbkrConnection();

  const label = !configured
    ? "Connect IBKR"
    : authenticated
      ? `IBKR ${accountId ?? "connected"}`
      : "IBKR not signed in";

  return (
    <Button variant="outline" size="sm" onClick={openConnectModal}>
      <Network
        className={`h-3.5 w-3.5 ${authenticated ? "text-primary" : "text-muted-foreground"}`}
      />
      <span className="font-mono text-[11px]">{label}</span>
    </Button>
  );
}
